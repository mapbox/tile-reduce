//identify disconnected major roads
var turf = require('turf');
var tilebelt = require('tilebelt');

module.exports = function(tileLayers, tile){
  var bbox = tilebelt.tileToBBOX(tile);
  var minDistance = 50/5280; // 50 ft in miles
  var disconnects = turf.featurecollection([]);
  var preserve = { "motorway" : true, "primary" : true, "secondary" : true, "tertiary" : true, "trunk": true };
  var caps = {};
  var orig = {};

try {
  for (layer in tileLayers.streets) {
    tileLayers.streets[layer].features.forEach(function(line){
      // if (preserve[line.properties.type] && line.geometry.type === 'LineString') {
      if (preserve[line.properties.type] && (line.geometry.type === 'LineString' || line.geometry.type === 'MultiLineString')) {
        // get start and end points
        var ends = [
          line.geometry.coordinates[0],
          line.geometry.coordinates[line.geometry.coordinates.length-1]
        ];

        // count how many times each endpoint appears
        // so we can choose only those that are not already
        // connected to something
        ends.forEach(function(end){
          if (end[0] < bbox[0] || end[0] > bbox[2] || end[1] < bbox[1] || end[1] > bbox[3]) {
            return;
          }

          if (!(end[0] in caps)) {
            caps[end[0]] = {};
            orig[end[0]] = {};
          }

          if (!(end[1] in caps[end[0]])) {
            caps[end[0]][end[1]] = 0;
            orig[end[0]][end[1]] = 0;
          }

          caps[end[0]][end[1]]++;
          orig[end[0]][end[1]] = end;
        });
      }
    });
  }

  for (x in caps) {
    for (y in caps[x]) {
      if (caps[x][y] == 1) {
        var end = turf.point([Number(x), Number(y)]);
        var exact = 0;

        for (layer in tileLayers.streets) {
          tileLayers.streets[layer].features.forEach(function(line2){
            var i;
            for (i = 0; i < line2.geometry.coordinates.length; i++) {
              if (x == line2.geometry.coordinates[i][0] && y == line2.geometry.coordinates[i][1]) {
                exact++;
              }
            }
          });
        }

        if (exact == 1) { // exactly matches only itself
          var best = Number.MAX_VALUE;
          for (layer in tileLayers.streets) {
            tileLayers.streets[layer].features.forEach(function(line2){
              if (line2.geometry.type === 'LineString' || line2.geometry.type === 'MultiLineString') {
                var distance = turf.distance(end, turf.pointOnLine(line2, end));
		if (distance < minDistance) {
			console.log(distance + " " + JSON.stringify(line2));
		}
                if (distance < best && distance != 0) {
                  best = distance;
                  bestest = line2;
                }
              }
            });
          }

          if (best < minDistance) {
            end.properties.distance = best;
            disconnects.features.push(end);
            console.log((best * 5280) + " http://www.openstreetmap.org/edit#map=24/" + y + "/" + x + " " + JSON.stringify(end) + " " + JSON.stringify(orig[x][y]) + " " + JSON.stringify(bestest));
		console.log("---------");
          }
        }
      };
    }
  };
} catch (e) { console.log(e.stack) }
  
  // return points where distance is less than 50 feet
  return disconnects;
}
