var turf = require('turf'),
  flatten = require('geojson-flatten');

module.exports = function(tileLayers, opts) {
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
  console.log(JSON.stringify(erase));
  // why are my results from such a large tile?
    // osm tile is huge compared to tiger tile

  return streetsRoads;
};
