'use strict';

var tileReduce = require('../../src');
var path = require('path');

tileReduce({
  bbox: [-122.05862045288086, 36.93768132842635, -121.97296142578124, 37.00378647456494],
  zoom: 15,
  map: path.join(__dirname, 'diff.js'),
  sources: [
    {name: 'osm',   mbtiles: path.join(__dirname, '../../test/fixtures/osm.mbtiles'), raw: true},
    {name: 'tiger', mbtiles: path.join(__dirname, '../../test/fixtures/tiger.mbtiles'), raw: true}
  ]
})
.on('start', function() {
  // null feature is a hack to be able to write each feature starting with a comma
  process.stdout.write('{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": null, "properties": null}');
})
.on('end', function() {
  process.stdout.write(']}');
});
