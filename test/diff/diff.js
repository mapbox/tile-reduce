var turf = require('turf'),
  flatten = require('geojson-flatten'),
  normalize = require('geojson-normalize'),
  tilebelt = require('tilebelt');

module.exports = function(tileLayers, tile) {
  var tigerRoads = tileLayers.tiger.tiger20062014;

  tigerRoads.features = tigerRoads.features.map(function(road) {
    return turf.buffer(road, 1, 'meters').features[0];
  });
  tigerRoads = turf.merge(tigerRoads);

  var streets = normalize(flatten(tileLayers.streets.road));
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.bridge)).features);
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.tunnel)).features);

  streets.features = streets.features.map(function(road){
    return turf.buffer(road, 20, 'meters').features[0];
  });
  streets = turf.merge(streets);

  var erase = turf.erase(flatten(tigerRoads)[0], flatten(streets)[0]);

  var tileBounds = {
    "type": "Feature",
    "geometry": tilebelt.tileToGeoJSON(tile),
    "properties": {}
  };

  var bufferedBounds = turf.buffer(tileBounds, 1, 'miles');
  var tileHole = turf.erase(bufferedBounds.features[0], tileBounds);
  var tigerDeltas = turf.erase(erase, tileHole);

  // return a feature collection
  return tigerDeltas;
};
