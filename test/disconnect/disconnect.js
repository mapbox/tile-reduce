//identify disconnected major roads
var turf = require('turf');

module.exports = function(tileLayers, opts){
  var minDistance = 50/5280; // 50 ft in miles
  var streetsRoads = tileLayers.streets.road;
  var disconnects = turf.featurecollection([]);
  var preserve = { "motorway" : true, "primary" : true, "secondary" : true, "tertiary" : true, "trunk": true };

  streetsRoads.features.forEach(function(line){
    if (preserve[line.properties.type]) {
      // get start and end points
      var ends = [
        turf.point(line.geometry.coordinates[0]),
        turf.point(line.geometry.coordinates[line.geometry.coordinates.length-1])
      ];

      // check whether each end is close but not exactly on any other line
      ends.forEach(function(end){
        streetsRoads.features.forEach(function(line2){
          if (preserve[line2.properties.type]) {
            var distance = turf.distance(end, turf.pointOnLine(line2, end));

            if (distance < minDistance && distance != 0) {
              disconnects.features.push(end);
            }
          }
        });
      });
    }
  });
  
  // return points where distance is less than 50 feet
  return disconnects;
}
