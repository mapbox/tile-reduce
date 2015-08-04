var turf = require('turf');
var normalize = require('geojson-normalize');
var flatten = require('geojson-flatten');

module.exports = function(tileLayers, opts, done){
  var streets = normalize(tileLayers.streets.migeojson);

  var tags = [
    'highway'
  ];
  var streetTypes = [
    'motorway',
    'motorway_link',
    'main',
    'street',
    'street_limited',
    'service',
    'driveway',
    'path'
  ];
  var miles = 0;

  streets.features.forEach(function(feature) {
    tags.forEach(function(tag) {
      if (streetTypes.indexOf(feature.properties[tag]) > -1) {
        miles += turf.lineDistance(feature, 'miles');
      }
    });
  });

  done(null, miles);
};
