var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');
var request = require('request');
var turf = require('turf');
var queue = require('queue-async');
var sqlite = require('sqlite3');
var fs = require('fs');
var path = require('path');
var http = require('http');

var dbs = {};

process.on('message', function(data) {
  var mapOperation = require(data.opts.map);
  var mbtiles;
  var qq = queue(4);

  data.opts.tileLayers.forEach(function(tl) {
    // get and connect to any sqlite databases needed
    console.log(tl.name);
    if (tl.mbtiles) {
      mbtiles = true;
      qq.defer(getMbtiles, tl.mbtiles, function(err) {
        if (err) return console.log('mbtiles error', err);
        var dbPath = './' + path.basename(tl.mbtiles);
        dbs[tl.name] = new sqlite.Database(dbPath, function(err) {
          if (err) return console.log('mbtiles error', err);
          console.log('processing tiles');
        });
      });
    }
  });

  if (mbtiles) {
    qq.awaitAll(function(err, res) {
      console.log('all sqlite databases initialized');
      processTiles(data.tiles, data.opts.tileLayers);
    });
  } else {
    processTiles(data.tiles, data.opts.tileLayers);
  }

});

function processTiles(tiles, tileLayers, done) {
  tiles.forEach(function(tile){
    var layerCollection = {};
    var q = queue(4);
    tileLayers.forEach(function(tileLayer){
      q.defer(getVectorTile, tile, tileLayer);
    });
    q.awaitAll(function(err, res){
      if (res) {
        res.forEach(function(item){
          item.layers.forEach(function(layer){
            if(!layerCollection[item.name]) layerCollection[item.name] = {};
            layerCollection[item.name][layer] = item[layer];
          });
        });
        mapOperation(layerCollection, tile, function(err, message){
          done();
          process.send(message);
        });
      } else {
        done();
        process.send(0);
      }
    });
  });
}

function getMbtiles(url, cb, done) {
  fs.exists('./' + path.basename(url), function(exists) {
    if (!exists) {
      console.log('downloading', url);
      // download the file to the local dir
      cb();
      done();
    } else {
      cb();
      done();
    }
  });
}

function getVectorTile(tile, tileLayer, done){
  var layers = {
    name: tileLayer.name,
    layers: tileLayer.layers
  };

  if (tileLayer.mbtiles) {
    console.log('hit', tileLayer.name, tile);
    dbs[tileLayer.name].get('select tile_data from tiles;', function(err, row) {
      featureTile(row.tile_data, tileLayer.layers, done);
    });
  } else {
    var url = tileLayer.url.split('{x}').join(tile[0]);
    url = url.split('{y}').join(tile[1]);
    url = url.split('{z}').join(tile[2]);

    var requestOpts = {
      url: url,
      gzip: true,
      encoding: null
    };

    request(requestOpts, function(err, res, body) {
      featureTile(body, tileLayer.layers, done);
    });
  }
}

function featureTile(data, layers, cb) {
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
