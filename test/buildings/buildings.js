module.exports = function(tileLayers, opts, done){
  done(null, tileLayers.streets.building.features.length);
};
