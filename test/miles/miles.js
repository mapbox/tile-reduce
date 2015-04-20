var turf = require('turf');
var normalize = require('geojson-normalize');
var flatten = require('geojson-flatten');

module.exports = function(tileLayers, opts, done){
  var streets = normalize(tileLayers.streets.road);
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.bridge)).features);
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.tunnel)).features);

  // to avoid counting railways and similar items included in streets
  // ref https://www.mapbox.com/developers/vector-tiles/mapbox-streets/#tunnel-road-bridge
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
    if (streetTypes.indexOf(feature.properties['class']) > -1) {
      miles += turf.lineDistance(feature, 'miles');
    }
  });

  done(null, miles);
};
