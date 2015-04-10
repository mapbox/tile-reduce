var turf = require('turf'),
  flatten = require('geojson-flatten'),
  tilebelt = require('tilebelt');

module.exports = function(tileLayers, tile) {
  console.log('working on ', tile);

  var tigerRoads = tileLayers.tiger.tiger20062014;

  tigerRoads.features = tigerRoads.features.map(function(road) {
    return turf.buffer(road, 1, 'meters').features[0];
  });
  tigerRoads = turf.merge(tigerRoads);

  var streetsRoads = tileLayers.streets.road;
  streetsRoads.features = streetsRoads.features.map(function(road){
    return turf.buffer(road, 20, 'meters').features[0];
  });
  streetsRoads = turf.merge(streetsRoads);

  var erase = turf.erase(flatten(tigerRoads)[0], flatten(streetsRoads)[0]);

  var tileBounds = {
    "type": "Feature",
    "geometry": tilebelt.tileToGeoJSON(tile),
    "properties": {}
  };

  var bufferedBounds = turf.buffer(tileBounds, 1, 'miles');
  var tileHole = turf.erase(bufferedBounds.features[0], tileBounds);
  var target = turf.erase(erase, tileHole);

  console.log('---');
  console.log(JSON.stringify(target));
  console.log('---');

  return erase;
};
