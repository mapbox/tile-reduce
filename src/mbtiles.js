'use strict';

var zlib = require('zlib');
var MBTiles = require('mbtiles');
var parseVT = require('./vt');

module.exports = mbTilesVT;

function mbTilesVT(source, ready) {
  var db = new MBTiles(source.mbtiles, dbReady);

  function dbReady(err, db) {
    if (err) ready(err);
    else db.getInfo(infoReady);
  }

  function infoReady(err, info) {
    if (err) {
      ready(err);
    } else if (info.format === 'pbf') {
      ready(null, getVT);
    } else {
      ready(new Error('Unsupported MBTiles format: ' + info.format));
    }
  }

  function getVT(tile, done) {
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
}
