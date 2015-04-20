//identify disconnected major roads
var turf = require('turf');
var tilebelt = require('tilebelt');
var flatten = require('geojson-flatten');

module.exports = function(tileLayers, tile, done){
  var bbox = tilebelt.tileToBBOX(tile);
  var minDistance = 50/5280; // 50 ft in miles
  var disconnects = turf.featurecollection([]);
  var caps = [];

  // Types we are looking for disconnected ends for
  var preserve_type = { "motorway" : true, "primary" : true, "secondary" : true, "tertiary" : true, "trunk": true, "residential": true };

  // Classes that we don't want to suggest that they should connect to
  var reject_class = { "major_rail" : true, "minor_rail" : true, "aerialway" : true };

  // First pass: finding road ends that don't connect to anything
  for (var layer in tileLayers.streets) {
    var i, j, k, f, g;

    for (var i = 0; i < tileLayers.streets[layer].features.length; i++) {
      var flat = flatten(tileLayers.streets[layer].features[i]);

      for (var f = 0; f < flat.length; f++) {
        var line = flat[f];

        if (preserve_type[line.properties.type] && (line.geometry.type === 'LineString')) {
          var endps = [ 0, line.geometry.coordinates.length - 1 ];

          endps.forEach(function(endp) {
            var end = line.geometry.coordinates[endp];

            // It's not dangling if it's a loop connecting back to itself
            for (var g = 0; g < flat.length; g++) {
              var line2 = flat[g];

              for (var j = 0; j < line2.geometry.coordinates.length; j++) {
                if (end[0] == line2.geometry.coordinates[j][0] && end[1] == line2.geometry.coordinates[j][1]) {
                  if (f != g) {
                    return;
                  } else {
                    if (j != endp) {
                      return;
                    }
                  }
                }
              }
            }

            // It's not dangling if it's outside the bounding box and was just clipped here
            if (end[0] < bbox[0] || end[0] > bbox[2] || end[1] < bbox[1] || end[1] > bbox[3]) {
              return;
            }

            var dup = false;

            // It's also not dangling if it connects to any other road
            for (var layer2 in tileLayers.streets) {
              for (var j = 0; j < tileLayers.streets[layer2].features.length; j++) {
                var flat2 = flatten(tileLayers.streets[layer2].features[j]);

                flat2.forEach(function(line2) {
                  if (layer === layer2 && i == j) {
                    return;
                  }

                  for (var k = 0; !dup && k < line2.geometry.coordinates.length; k++) {
                    if (end[0] === line2.geometry.coordinates[k][0] && end[1] === line2.geometry.coordinates[k][1]) {
                      dup = true;
                    }
                  }
                });
              }
            }

            if (!dup) {
              caps.push({layer: layer, i: i, point: turf.point(end), line: line});
            }
          });
        }
      }
    }
  }

  // Second pass: find other roads that are near the dangling ends
  caps.forEach(function(cap) {
    var best = Number.MAX_VALUE;
    var bestline = null;

    for (var layer in tileLayers.streets) {
      var i;

      for (var i = 0; i < tileLayers.streets[layer].features.length; i++) {
        var flat = flatten(tileLayers.streets[layer].features[i]);

        flat.forEach(function(line) {
          // Don't try to match an endpoint to the way that it came from
          if (layer == cap.layer && i == cap.i) {
            return;
          }

          if (!reject_class[line.properties.class] && line.geometry.type === 'LineString') {
            var distance = turf.distance(cap.point, turf.pointOnLine(line, cap.point));

            if (distance < best) {
              var already = false;

              // Don't try to match an endpoint to a way that the
              // way that it comes from already connects to
              cap.line.geometry.coordinates.forEach(function(capp) {
                line.geometry.coordinates.forEach(function(linep) {
                  if (capp[0] == linep[0] && capp[1] == linep[1]) {
                    already = true;
                  }
                });
              });

              if (!already) {
                best = distance;
                bestline = line;
              }
            }
          }
        });
      }
    }

    if (best < minDistance) {
      cap.point.properties.unconnected_way = cap.line.properties.osm_id;
      cap.point.properties.unconnected_type = cap.line.properties.type;
      cap.point.properties.unconnected_distance_feet = best * 5280;
      cap.point.properties.possible_link = bestline.properties.osm_id;
      disconnects.features.push(cap.point);
      // console.log((best * 5280) + " http://www.openstreetmap.org/edit#map=24/" + cap.point.geometry.coordinates[1] + "/" + cap.point.geometry.coordinates[0] + " " + JSON.stringify(cap.point) + " " + JSON.stringify(bestline));
    }
  });
  
  // return points where distance is less than 50 feet
  done(null, disconnects);
};
