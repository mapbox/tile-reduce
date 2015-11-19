'use strict';

var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');

module.exports = parseData;

function parseData(data, tile, source) {
  var vt;
  if (!data) vt = {layers: {}};
  else vt = new VectorTile(new Pbf(data));
  return source.raw ? vt.layers : toGeoJSON(vt, tile, source);
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
