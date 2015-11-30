'use strict';

var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');

module.exports = parseData;

function parseData(data, tile, source) {
  var layers = new VectorTile(new Pbf(data)).layers;
  return source.raw ? layers : toGeoJSON(layers, tile, source);
}

function toGeoJSON(layers, tile, source) {
  var collections = {};

  for (var layerId in layers) {
    if (source.layers && source.layers.indexOf(layerId) === -1) continue;

    collections[layerId] = {
      type: 'FeatureCollection',
      features: []
    };
    for (var k = 0; k < layers[layerId].length; k++) {
      collections[layerId].features.push(
        layers[layerId].feature(k).toGeoJSON(tile[0], tile[1], tile[2])
      );
    }
  }
  return collections;
}
