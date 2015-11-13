'use strict';

var zlib = require('zlib');
var MBTiles = require('mbtiles');
var parseVT = require('./vt');

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
    done(null, parseVT(data, tile, source));
  }
}
