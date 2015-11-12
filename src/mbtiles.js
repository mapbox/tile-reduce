'use strict';

var MBTiles = require('mbtiles');
var zlib = require('zlib');
var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');

module.exports = mbTilesVT;

function mbTilesVT(source, ready) {
  var db = new MBTiles(source.mbtiles, dbReady);
  var getTile;

  function dbReady(err, db) {
    if (err) ready(err);
    else db.getInfo(infoReady);
  }

  function infoReady(err, info) {
    if (err) {
      ready(err);
    } else if (info.format === 'pbf') {
      getTile = getVT;
      ready();
    } else {
      ready(new Error('Unsupported MBTiles format: ' + info.format));
    }
  }

  return function(tile, done) {
    getTile(db, source, tile, done);
  };
}

function getVT(db, source, tile, done) {
  db.getTile(tile[2], tile[0], tile[1], tileFetched);

  function tileFetched(err, data) {
    if (!err) zlib.unzip(data, tileUnzipped);
    else if (err.message === 'Tile does not exist') done();
    else done(err);
  }

  function tileUnzipped(err, data) {
    if (err) done(err);
    else if (source.raw) done(null, new VectorTile(new Pbf(data)).layers);
    else done(null, toGeoJSON(new VectorTile(new Pbf(data)), tile, source));
  }
}

function toGeoJSON(vt, tile, source) {
  var layers = Object.keys(vt.layers);
  var collections = {};

  for (var i = 0; i < layers.length; i++) {
    if (!source.layers || source.layers.indexOf(layers[i]) !== -1) {
      collections[layers[i]] = {
        type: 'FeatureCollection',
        features: []
      };
      for (var k = 0; k < vt.layers[layers[i]].length; k++) {
        collections[layers[i]].features.push(
          vt.layers[layers[i]].feature(k).toGeoJSON(tile[0], tile[1], tile[2])
        );
      }
    }
  }
  return collections;
}
