'use strict';

var tileReduce = require('../../src');
var path = require('path');

var numRoads = 0;

tileReduce({
  bbox: [-131.693128, 30.664709, -100.681513, 55.35384],
  zoom: 12,
  map: path.join(__dirname, '/count.js'),
  sources: [{name: 'osm', mbtiles: path.join(__dirname, '../../../mbtiles/us-west.mbtiles')}]
})
.on('reduce', function(num) {
  numRoads += num;
})
.on('end', function() {
  console.log('Roads total: %d', numRoads);
});
