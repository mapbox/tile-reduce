'use strict';

var request = require('request');
var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');

module.exports = remoteVT;

var tileRequest = request.defaults({
  gzip: true,
  encoding: null,
  agentOptions: {maxSockets: 5}
});

function remoteVT(config, ready) {
  ready();

  return function(tile, done) {
    var url = config.url
      .replace('{x}', tile[0])
      .replace('{y}', tile[1])
      .replace('{z}', tile[2]);

    tileRequest(url, function(err, res, body) {
      if (err) return done(err);
      else if (res.statusCode !== 200) return done(new Error('Server responded with status code ' + res.statusCode));
      else return done(null, new VectorTile(new Pbf(body)).layers);
    });
  };
}
