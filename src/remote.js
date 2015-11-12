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

function remoteVT(source, ready) {
  ready();

  return function(tile, done) {
    var url = source.url
      .replace('{x}', tile[0])
      .replace('{y}', tile[1])
      .replace('{z}', tile[2]);

    tileRequest(url, function(err, res, body) {
      if (err) return done(err);
      else if (res.statusCode !== 200) return done(new Error('Server responded with status code ' + res.statusCode));
      else if (source.raw) done(null, new VectorTile(new Pbf(body)).layers);
      else done(null, toGeoJSON(new VectorTile(new Pbf(body)), tile, source));
    });
  };
}

function toGeoJSON(vt, tile, source) {
  var layers = Object.keys(vt.layers);
  var collections = {};

  for (var i = 0; i < layers.length; i++) {
    if (!source.layers || source.layers.indexOf(layers[i]) !== -1) {
      collections[layers[i]] = {
        type: 'FeatureCollection',
        features: []
      };
      for (var k = 0; k < vt.layers[layers[i]].length; k++) {
        collections[layers[i]].features.push(
          vt.layers[layers[i]].feature(k).toGeoJSON(tile[0], tile[1], tile[2])
        );
      }
    }
  }
  return collections;
}
