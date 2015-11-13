'use strict';

var linematch = require('linematch');
var lineclip = require('lineclip');

module.exports = function(data, tile, writeData, done) {

  // filter and normalize input geometry
  var tiger = toLines(data.tiger.tiger);
  var streets = toLines(data.osm.roads);

  // find tiger parts that are not covered by streets within 10 pixels;
  // filter out chunks that are too short
  var diff = linematch(tiger, streets, 10).filter(filterShort);

  if (diff.length) {
    // write a feature with the diff as MultiLineString
    // console.log(diff.length)
    writeData(',' + JSON.stringify({
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
      var y2 = 180 - (p[1] + y0) * 360 / size;
      diff[i][j] = [
        round((p[0] + x0) * 360 / size - 180),
        round(360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90)];
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

      for (var k = 0; k < geom.length; k++) {
        lineclip(normalizeLine(geom[k], layer.extent), bbox, lines); // clip to tile bbox and add to result
      }
    }
  }
  return lines;
}

function normalizeLine(line, extent) {
  var newLine = [];
  for (var i = 0; i < line.length; i++) {
    newLine.push([
      line[i].x * 4096 / extent,
      line[i].y * 4096 / extent]);
  }
  return newLine;
}

function filterShort(line) {
  return dist(line) >= 30; // line length is at least 30 pixels
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
