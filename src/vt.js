'use strict';

const VectorTile = require('vector-tile').VectorTile;
const Pbf = require('pbf');

module.exports = parseData;

function parseData(data, tile, source) {
  const layers = new VectorTile(new Pbf(data)).layers;
  return source.raw ? layers : toGeoJSON(layers, tile, source);
}

function toGeoJSON(layers, tile, source) {
  const collections = {};

  for (let layerId of Object.keys(layers)) {
    if (source.layers && source.layers.indexOf(layerId) === -1) continue;

    const col = collections[layerId] = {
      type: 'FeatureCollection',
      features: []
    };
    for (let k = 0; k < layers[layerId].length; k++) {
      col.features.push(layers[layerId].feature(k).toGeoJSON(...tile));
    }
  }
  return collections;
}
