var EventEmitter = require('events').EventEmitter;
var cover = require('tile-cover');
var tilebelt = require('tilebelt');
var turf = require('turf');
var fork = require('child_process').fork;
var cpus = require('os').cpus().length;
var rateLimit = require('function-rate-limit');
var queue = require('queue-async');
var request = require('request');
var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');
var MBTiles = require('mbtiles');
var zlib = require('zlib');

module.exports = function (coverArea, opts){
  var workers = [];
  var tilesCompleted = 0;
  var ee = new EventEmitter();
  var dbs = {};

  // compute cover
  var tiles = computeCover(coverArea, opts.zoom);

  // send back tiles that will be processed
  setTimeout(function(){
    ee.emit('start', tiles);
  }, 0);

  // create workers
  for (var i = 0; i < cpus; i++) {
    workers[i] = workers[i] || fork(__dirname + '/worker.js');
    workers[i].on('message', function(message) {
      if(message) ee.emit('reduce', message);
      tilesCompleted++;

      // if all tiles have been processed, kill workers and emit 'end' event
      if(tilesCompleted >= tiles.length){
        while (workers.length) {
          workers.shift().kill('SIGHUP');
        }
        ee.emit('end');
      }
    });

    workers[i].on('error', function(err) {
      ee.emit('error', err);
    });
  }

  ee.run = function () {
    sendData(tiles, workers, opts);
  };

  return ee;
};

function getRemoteVectorTile(tile, tileLayer, done){
  var url = tileLayer.url.split('{x}').join(tile[0]);
  url = url.split('{y}').join(tile[1]);
  url = url.split('{z}').join(tile[2]);

  var requestOpts = {
    url: url,
    gzip: true,
    encoding: null
  };
  request(requestOpts, function(err, res, body) {
    getTileFeatures(tile, body, tileLayer, done);
  });
}

function getLocalVectorTile(tile, tileLayer, dbs, done){
  var tilename = tileLayer.mbtiles.split('.')[0];

  dbs[tilename].getTile(tile[2],tile[0],tile[1],function(err, data) {
    if (err) throw err;
    zlib.unzip(data, function(err, body) {
      getTileFeatures(tile, body, tileLayer, done);
    });
  });
}

function getTileFeatures(tile, data, tileLayer, cb){
  var layers = {
    name:tileLayer.name,
    layers:tileLayer.layers
  };

  var vt;
  try {
    vt = new VectorTile(new Pbf(new Uint8Array(data)));
  } catch(e) {
    cb(e, null);
  }

  tileLayer.layers.forEach(function(layer){
    layers[layer] = turf.featurecollection([]);
    if (vt && vt.layers[layer]) {
      for (var i = 0; i < vt.layers[layer].length; i++) {
        try {
          layers[layer].features.push(vt.layers[layer].feature(i).toGeoJSON(tile[0],tile[1],tile[2]));
        } catch(e) {
          cb(e, null);
        }
      }
    }
  });

  cb(null, layers);
}

function loadTiles(mbtile, dbs, done){
  new MBTiles(mbtile, function(err, src) {
    if (err) throw err;
    dbs[mbtile.split('.')[0]] = src;
    done(err, null);
  });
}

function sendData (tiles, workers, opts){
  var dbs = {};
  var rl = false;
  var q = queue(4);

  var getData = function(tile){
    var layerCollection = {};
    var q = queue(4);
    opts.tileLayers.forEach(function(tileLayer){
      if (tileLayer.url) q.defer(getRemoteVectorTile, tile, tileLayer);
      if (tileLayer.mbtiles) q.defer(getLocalVectorTile, tile, tileLayer, dbs);
    });
    q.awaitAll(function(err, res){
      if(res){
        res.forEach(function(item){
          item.layers.forEach(function(layer){
            if(!layerCollection[item.name]) layerCollection[item.name] = {};
            layerCollection[item.name][layer] = item[layer];
          });
        });
        workers[getRandomInt(0, workers.length-1)].send({
          tile: tile,
          collection: layerCollection,
          opts: opts
        });
      }
    });
  }

  opts.tileLayers.forEach(function(tl){
    if (tl.url || opts.maxrate) rl = true;
    if (tl.mbtiles) {
      q.defer(loadTiles, tl.mbtiles, dbs);
    }
  });
  
  q.awaitAll(function(err, res){
    if (rl) {
      if(!opts.maxrate || opts.maxrate > 200) opts.maxrate = 200;
      tiles.forEach(function(tile){
        rateLimit(opts.maxrate / opts.tileLayers.length, 1000, getData(tile));
      });
    } else {
      tiles.forEach(function(tile){
        getData(tile);
      });
    }
  });
}

function computeCover (coverArea, zoom) {
  if(coverArea instanceof Array && isValidTile(coverArea[0])) {
    // array of tiles
    return tilesToZoom(coverArea, zoom);
  } else if(isValidTile(coverArea)) {
    // single tile
    if(coverArea[2] === zoom) return [coverArea];
    else return tilesToZoom([coverArea], zoom);
  } else if(coverArea instanceof Array && coverArea.length === 4) {
    // bbox
    var poly = turf.bboxPolygon(coverArea);
    return cover.tiles(poly.geometry, {min_zoom: zoom, max_zoom: zoom});
  } else if(coverArea.type === 'Feature') {
    // GeoJSON Feature or FeatureCollection
    return cover.tiles(coverArea.geometry, {min_zoom: zoom, max_zoom: zoom});
  } else {
    throw new Error('Unrecognized cover type');
  }
}

function isValidTile (tile) {
  if(tile instanceof Array &&
    tile.length === 3 &&
    typeof tile[0] === 'number' &&
    typeof tile[0] === 'number' &&
    typeof tile[0] === 'number') return true;
  else return false;
}

function tilesToZoom(tiles, zoom) {
  var newTiles = zoomTiles(tiles, zoom);
  return newTiles;

  function zoomTiles(zoomedTiles) {
    if(zoomedTiles[0][2] === zoom){
      return zoomedTiles;
    } else if(zoomedTiles[0][2] < zoom){
      var oneIn = [];
      zoomedTiles.forEach(function(tile){
        oneIn = oneIn.concat(tilebelt.getChildren(tile));
      });
      return zoomTiles(oneIn);
    } else {
      var zoomedTiles = zoomedTiles.map(function(tile){
        var centroid =
          turf.centroid(
            turf.bboxPolygon(
              tilebelt.tileToBBOX(tile)
            )
          );
        return tilebelt.pointToTile(
          centroid.geometry.coordinates[0],
          centroid.geometry.coordinates[1], zoom);
      });
      return zoomedTiles;
    }
  }
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendTiles (tiles, workers, opts) {
  if(!opts.maxrate || opts.maxrate > 200) opts.maxrate = 200;
  var sendTile = rateLimit(opts.maxrate / opts.tileLayers.length, 1000, function(tile){
    workers[getRandomInt(0, workers.length-1)].send({
      tiles: [tile],
      opts: opts
    });
  });
  tiles.forEach(function(tile){
    sendTile(tile);
  });
}

module.exports.computeCover = computeCover;
module.exports.isValidTile = isValidTile;
module.exports.tilesToZoom = tilesToZoom;
module.exports.sendData = sendData;
module.exports.sendTiles = sendTiles;
module.exports.loadTiles = loadTiles;
module.exports.getRemoteVectorTile = getRemoteVectorTile;
module.exports.getLocalVectorTile = getLocalVectorTile;
module.exports.getTileFeatures = getTileFeatures;
