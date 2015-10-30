'use strict';

var linematch = require('linematch');
var lineclip = require('lineclip');

module.exports = function(data, tile, done) {

  // filter and normalize input geometry
  var tiger = toLines(data.tiger.tiger2015);
  var streets = toLines(data.osm.osm);

  // find tiger parts that are not covered by streets within 10 pixels
  var diff = linematch(tiger, streets, 10);

  if (diff.length) {
    // write a feature with the diff as MultiLineString
    process.stdout.write(',' + JSON.stringify({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiLineString',
        coordinates: toGeoJSON(diff, tile)
      }
    }));
  }

  done(null, null);
};

function toGeoJSON(diff, tile) {
  var size = 4096 * Math.pow(2, tile[2]);
  var x0 = 4096 * tile[0];
  var y0 = 4096 * tile[1];

  for (var i = 0; i < diff.length; i++) {
    for (var j = 0; j < diff[i].length; j++) {
      var p = diff[i][j];
      diff[i][j] = [
        round((p[0] + x0) * 360 / size - 180),
        round(360 / Math.PI * Math.atan(Math.exp((180 - (p[1] + y0) * 360 / size) * Math.PI / 180)) - 90)
      ];
    }
  }
  return diff;
}

function round(num) {
  return Math.round(num * 1e6) / 1e6;
}

function toLines(layer) {
  var lines = [];
  var bbox = [0, 0, 4096, 4096];

  for (var i = 0; i < layer.length; i++) {
    var feature = layer.feature(i);

    // only consider polygon features with Tiger name or OSM highway tag
    if (feature.type === 2 && (feature.properties.FULLNAME !== '' || feature.properties.highway)) {
      var geom = feature.loadGeometry();

      // normalize line geometry
      var line = [];
      for (var k = 0; k < geom.length; k++) {
        for (var j = 0; j < geom[k].length; j++) {
          line.push([
            geom[k][j].x * 4096 / layer.extent,
            geom[k][j].y * 4096 / layer.extent
          ]);
        }
      }

      // only consider lines that are longer than 20 pixels
      if (dist(line) >= 20) {
        lineclip(line, bbox, lines); // clip to tile bbox
      }
    }
  }
  return lines;
}

function dist(line) { // approximate distance
  var d = 0;
  for (var i = 1; i < line.length; i++) {
    var dx = line[i][0] - line[i - 1][0];
    var dy = line[i][1] - line[i - 1][1];
    d += Math.sqrt(dx * dx + dy * dy);
  }
  return d;
}
