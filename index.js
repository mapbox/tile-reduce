var EventEmitter = require("events").EventEmitter;
var cover = require('tile-cover');
var tilebelt = require('tilebelt');
var turf = require('turf');
var browserify = require('browserify');
var exec = require('child_process').execSync;
var fork = require('child_process').fork;
var cpus = require('os').cpus().length;
var rateLimit = require('function-rate-limit');

module.exports = function (coverArea, opts){
  var maxrate = 200;
  if(opts.maxrate < maxrate) maxrate = opts.maxrate;
  var throttle = 1000 / maxrate;
  var workers = [];
  var tilesCompleted = 0;
  var ee = new EventEmitter();

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
    sendTiles(workers, tiles, cpus, maxrate, opts);
  };

  return ee;
};

function sendTiles (maxrate, workers, tiles, opts) {
  var sendTile = rateLimit(maxrate / opts.tileLayers.length, 1000, function(tile){
    workers[getRandomInt(0, workers.length-1)].send({
      tiles: [tile],
      opts: opts
    });
  });
  tiles.forEach(function(tile){
    sendTile(tile);
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

module.exports.computeCover = computeCover;
module.exports.isValidTile = isValidTile;
module.exports.tilesToZoom = tilesToZoom;
module.exports.sendTiles = sendTiles;