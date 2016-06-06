'use strict';

var zlib = require('zlib');
var MBTiles = require('mbtiles');
var parseVT = require('./vt');

module.exports = function (options, callback) {
  var self = this;

  this.options = options;
  this.db = new MBTiles(options.mbtiles, dbReady);
  function dbReady(err, db) {
    if (err) callback(err);
    else self.db.getInfo(infoReady);
  }

  function infoReady(err, info) {
    if (err) {
      callback(err);
    } else if (info.format === 'pbf') {
      callback(null, self);
    } else {
      callback(new Error('Unsupported MBTiles format: ' + info.format));
    }
  }
};

module.exports.prototype.getTile = function (z, x, y, callback) {
  var self = this;
  this.db.getTile(z, x, y, tileFetched);

  function tileFetched(err, data) {
    if (!err) zlib.unzip(data, tileUnzipped);
    else if (err.message === 'Tile does not exist') callback();
    else callback(err);
  }

  function tileUnzipped(err, data) {
    if (err) callback(err);
    callback(null, parseVT(data, [x, y, z], self.options));
  }
};
