//identify disconnected major roads
var turf = require('turf');

module.exports = function(tileLayers, opts){
  var minDistance = 0.0094697 // 50 ft in miles
  var streetsRoads = tileLayers.streets.road;
  var caps = turf.featurecollection([]);
  var disconnects = turf.featurecollection([]);
  // TODO: filter everything except major roads
  // get start and end points
  streetRoads.features.forEach(function(line){
    caps.push(turf.point(line.geometry.coordinates[0]));
    caps.push(turf.point(line.geometry.coordinates[line.geometry.coordinates.length-1]));
  });
  
  // measure distances between every point
  caps.features.forEach(function(pt1){
    caps.features.forEach(function(pt2){
      if(turf.distance(pt1, pt2, 'miles') < minDistance)
        disconnects.push(pt1)
    });
  });

  // return points where distance is less than 50 feet
  return disconnects;
}