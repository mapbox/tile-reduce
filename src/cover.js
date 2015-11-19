'use strict';

module.exports = cover;

var tilecover = require('tile-cover');
var bboxPolygon = require('turf-bbox-polygon');

function cover(options) {
  if (Array.isArray(options.tiles)) return zoomTiles(options.tiles, options.zoom);

  var area = options.bbox ? bboxPolygon(options.bbox).geometry :
    options.geojson ? options.geojson.geometry || options.geojson : null;

  return area ? tilecover.tiles(area, {min_zoom: options.zoom, max_zoom: options.zoom}) : null;
}

function zoomTiles(tiles, zoom) {
  var zoomed = [];
  for (var i = 0; i < tiles.length; i++) {
    var tile = tiles[i];

    if (tile[2] === zoom) zoomed.push(tile);
    else if (tile[2] > zoom) throw new Error('Tile zoom is higher than expected.');
    else {
      var z2 = Math.pow(2, zoom - tile[2]);

      for (var x = tile[0] * z2; x < (tile[0] + 1) * z2; x++) {
        for (var y = tile[1] * z2; y < (tile[1] + 1) * z2; y++) zoomed.push([x, y, zoom]);
      }
    }
  }
  return zoomed;
}
