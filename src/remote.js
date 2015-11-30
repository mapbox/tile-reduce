'use strict';

var request = require('request');
var parseVT = require('./vt');
var rateLimit = require('function-rate-limit');

module.exports = remoteVT;

function remoteVT(source, ready) {
  var getTile = function(tile, done) {
    var url = source.url
      .replace('{x}', tile[0])
      .replace('{y}', tile[1])
      .replace('{z}', tile[2]);

    request({url: url, gzip: true, encoding: null}, function(err, res, body) {
      if (err) return done(err);
      else if (res.statusCode === 200) return done(null, parseVT(body, tile, source));
      else if (res.statusCode === 401) return done();
      else return done(new Error('Server responded with status code ' + res.statusCode));
    });
  };

  if (source.maxrate) getTile = rateLimit(source.maxrate, 1000, getTile);
  ready(null, getTile);
}
