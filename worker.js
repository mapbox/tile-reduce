var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');
var request = require('request');
var turf = require('turf');
var queue = require('queue-async');
var sqlite = require('sqlite3');
var fs = require('fs');
var path = require('path');
var http = require('http');

process.on('message', function(data) {
  var mapOperation = require(data.opts.map);
  var db;

  if (data.opts.tileLayers.mbtiles) {
    getMbtiles(data.opts.tileLayers.mbtiles, function(err) {
      if (err) return console.log('mbtiles error', err);
      var dbPath = './' + path.basename(data.opts.tileLayers.mbtiles);
      data.opts.tileLayers.mbtiles = new sqlite.Database(dbPath, 'sqlite3.OPEN_READONLY', function(err) {
        if (err) return console.log('mbtiles error', err);
        processTiles(data.tiles);
      });
    });
  } else {
    processTiles(data.tiles);
  }
});

function processTiles(tiles) {
  tiles.forEach(function(tile){
    var layerCollection = {};
    var q = queue(4);
    data.opts.tileLayers.forEach(function(tileLayer){
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
          process.send(message);
        });
      } else {
        process.send(0);
      }
    });
  });
}

function getMbtiles(url, cb) {
  fs.exists('./' + path.basename(url), function(exists) {
    if (!exists) {
      console.log('downloading', url);
      // download the file to the local dir
    } else {
      cb();
    }
  });
}

function getVectorTile(tile, tileLayer, done){
  var layers = {
    name: tileLayer.name,
    layers: tileLayer.layers
  };

  if (tileLayer.mbtiles) {
    // hit mbtiles
    // tileLayer.mbtiles.run('', function(err, results) {
    //   featureTile(result, tileLayer.layers, done);
    // });
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
