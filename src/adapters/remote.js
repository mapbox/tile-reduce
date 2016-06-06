'use strict';

var request = require('request');
var parseVT = require('./vt');
var lwip = require('lwip');
var rateLimit = require('function-rate-limit');

module.exports = function (options, callback) {
  this.options = options;
  if (options.maxrate) this.getTile = rateLimit(options.source.maxrate, 1000, getTile);
  callback(null, this);
};

module.exports.prototype.getTile = function (z, x, y, done) {
  var self = this;
  var url = this.options.url
    .replace('{x}', x)
    .replace('{y}', y)
    .replace('{z}', z);

  request({url: url, gzip: true, encoding: null}, function(err, res, body) {
    if (err) return done(err);
    else if (res.statusCode === 200) {
      var ctype = res.headers['content-type'].split('/')[1];

      // if content type is protobuf, read as a vector tile
      if (ctype === 'x-protobuf') {
        return done(null, parseVT(body, [x, y, z], self.options));
      } else {
        if (self.options.raw) return done(null, body);

        // otherwise, assume it's an image tile, open it with lwip
        lwip.open(body, ctype, function (err, img) {
          if (err) return done(err);
          done(null, img);
        });
      }
    }
    else if (res.statusCode === 401) return done();
    else if (res.statusCode === 404) return done();
    else return done(new Error('Server responded with status code ' + res.statusCode));
  });
};
