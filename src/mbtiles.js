'use strict';

var MBTiles = require('mbtiles');
var zlib = require('zlib');
var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');

module.exports = mbTilesVT;

function mbTilesVT(path, ready) {
  var db = new MBTiles(path, dbReady);
  var getTile;

  function dbReady(err, db) {
    if (err) ready(err);
    else db.getInfo(infoReady);
  }

  function infoReady(err, info) {
    if (err) ready(err);
    else if (info.format === 'pbf') {
      getTile = getVT;
      ready();
    } else {
      ready(new Error('Unsupported MBTiles format: ' + info.format));
    }
  }

  return function(tile, done) {
    getTile(db, tile, done);
  };
}

function getVT(db, tile, done) {
  db.getTile(tile[2], tile[0], tile[1], tileFetched);

  function tileFetched(err, data) {
    if (!err) zlib.unzip(data, tileUnzipped);
    else if (err.message === 'Tile does not exist') done(null, null);
    else done(err);
  }

  function tileUnzipped(err, data) {
    if (err) done(err);
    done(null, new VectorTile(new Pbf(data)).layers);
  }
}
