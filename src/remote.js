'use strict';

var request = require('request');
var parseVT = require('./vt');

module.exports = remoteVT;

var tileRequest = request.defaults({
  gzip: true,
  encoding: null,
  agentOptions: {maxSockets: 5}
});

function remoteVT(source, ready) {
  ready(null, getTile.bind(null, source));
}

function getTile(source, tile, done) {
  var url = source.url
    .replace('{x}', tile[0])
    .replace('{y}', tile[1])
    .replace('{z}', tile[2]);

  tileRequest(url, function(err, res, body) {
    if (err) return done(err);
    else if (res.statusCode === 200) return done(null, parseVT(body, tile, source));
    else if (res.statusCode === 404) return done(null, parseVT(null, tile, source));
    else if (res.statusCode !== 200) return done(new Error('Server responded with status code ' + res.statusCode));
  });
}
