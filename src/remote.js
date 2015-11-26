'use strict';

const request = require('request');
const parseVT = require('./vt');
const rateLimit = require('function-rate-limit');

module.exports = remoteVT;

function remoteVT(source, ready) {
  const getTile = (tile, done) => {
    const url = source.url
      .replace('{x}', tile[0])
      .replace('{y}', tile[1])
      .replace('{z}', tile[2]);

    request({url: url, gzip: true, encoding: null}, function(err, res, body) {
      if (err) done(err);
      else if (res.statusCode === 200) done(null, parseVT(body, tile, source));
      else if (res.statusCode === 401) done();
      else done(new Error('Server responded with status code ' + res.statusCode));
    });
  };

  ready(null, source.maxrate ? rateLimit(source.maxrate, 1000, getTile) : getTile);
}
