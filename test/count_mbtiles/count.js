module.exports = function(tileLayers, opts, done){
  var osmFeatures = tileLayers.osm.migeojson;
  done(null, osmFeatures.features.length);
};
