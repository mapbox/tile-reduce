var turf = require('turf');

module.exports = function(tileLayers, opts) {
  var streetsRoads = tileLayers.streets.road;
  streetsRoads.features = streetsRoads.features.map(function(road){
    return turf.buffer(road, 50, 'feet');
  });
  var tigerRoads = tileLayers.tiger.tiger20062014;
  tigerRoads = turf.erase(streetsRoads, tigerRoads);
  return tigerRoads;
};
