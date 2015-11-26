'use strict';

const zlib = require('zlib');
const MBTiles = require('mbtiles');
const parseVT = require('./vt');

module.exports = mbtiles;

function mbtiles(source, ready) {
  const db = new MBTiles(source.mbtiles, dbReady);

  function dbReady(err, db) {
    if (err) ready(err);
    else db.getInfo(infoReady);
  }

  function infoReady(err, info) {
    if (err) ready(err);
    else if (info.format === 'pbf') ready(null, getVT);
    else ready(new Error('Unsupported MBTiles format: ' + info.format));
  }

  function getVT(tile, done) {
    db.getTile(tile[2], tile[0], tile[1], (err, data) => {
      if (!err) zlib.unzip(data, tileUnzipped);
      else if (err.message === 'Tile does not exist') done();
      else done(err);
    });

    function tileUnzipped(err, data) {
      if (err) done(err);
      done(null, parseVT(data, tile, source));
    }
  }
}
