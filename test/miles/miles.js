var turf = require('turf');
var normalize = require('geojson-normalize');
var flatten = require('geojson-flatten');

module.exports = function(tileLayers, opts){
  var streets = normalize(tileLayers.streets.road);
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.bridge)).features);
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.tunnel)).features);

  var miles = 0;
  streets.features.forEach(function(feature) {
    miles += turf.lineDistance(feature, 'miles');
  });

  return miles;
};
