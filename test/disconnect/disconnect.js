//identify disconnected major roads
var turf = require('turf');

module.exports = function(tileLayers, opts){
  var minDistance = 50/5280; // 50 ft in miles
  var streetsRoads = tileLayers.streets.road;
  var caps = turf.featurecollection([]);
  var disconnects = turf.featurecollection([]);
  var preserve = { "motorway" : true, "primary" : true, "secondary" : true, "tertiary" : true, "trunk": true };
  // get start and end points
  streetsRoads.features.forEach(function(line){
    if (preserve[line.properties.type]) {
      caps.features.push(turf.point(line.geometry.coordinates[0]));
      caps.features.push(turf.point(line.geometry.coordinates[line.geometry.coordinates.length-1]));
    }
  });
  
  // measure distances between every point
  caps.features.forEach(function(pt1){
    caps.features.forEach(function(pt2){
      if(turf.distance(pt1, pt2, 'miles') < minDistance) {
        disconnects.features.push(pt1)
      }
    });
  });

  // return points where distance is less than 50 feet
  return disconnects;
}
