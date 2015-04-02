var turf = require('turf');

module.exports = function createDiff(tileLayers, opts){
  var streetsRoads = tileLayers.streets.roads;
  streetsRoads.features = streetsRoads.features.map(function(road){
    return turf.buffer(road, 50, 'feet');
  });
  var tigerRoads = tileLayers.tiger.roads;
  tigerRoads = turf.erase(streetsRoads, tigerRoads);
  return tigerRoads;
}