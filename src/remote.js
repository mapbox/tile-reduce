'use strict';

var request = require('request');
var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');

module.exports = remoteVT;

function remoteVT(urlTpl, ready) {
  ready();

  return function(tile, done) {
    var url = urlTpl
      .replace('{x}', tile[0])
      .replace('{y}', tile[1])
      .replace('{z}', tile[2]);

    request({url: url, gzip: true, encoding: null}, function(err, res, body) {
      if (err) done(err);
      else done(null, res.statusCode === 200 ? new VectorTile(new Pbf(body)).layers : null);
    });
  };
}
