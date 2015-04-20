module.exports = function(tileLayers, opts, done){
  var streetsRoads = tileLayers.streets.road;
  done(null, streetsRoads.features.length);
};
