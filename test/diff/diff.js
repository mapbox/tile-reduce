var turf = require('turf');

module.exports = function(tileLayers, opts) {
  var streetsRoads = tileLayers.streets.road;

  var tigerRoads = tileLayers.tiger.tiger20062014;
  tigerRoads.features = tigerRoads.features.map(function(road) {
    return turf.buffer(road, 1, 'feet');
  });
  tigerRoads = turf.merge(tigerRoads);

  streetsRoads.features = streetsRoads.features.map(function(road){
    return turf.buffer(road, 50, 'feet').features[0];
  });
  streetsRoads = turf.merge(streetsRoads);

  // we want
  // var erase = turf.erase(tigerRoads, streetsRoads);
  // but tigerRoads and streetsRoads are both multipolygons
  // soooo, now what?

  return streetsRoads;
};
