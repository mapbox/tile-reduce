module.exports = function createDiff(tileLayers, opts){
  var streetsRoads = tileLayers.streets.road;
  return streetsRoads.features.length;
}