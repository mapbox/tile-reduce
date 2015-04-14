module.exports = function(tileLayers, opts){
  var streetsRoads = tileLayers.streets.road;
  return streetsRoads.features.length;
};
