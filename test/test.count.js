'use strict';

var test = require('tap').test;
var tileReduce = require('../src');
var path = require('path');

test('count implementation', function(t) {
  var numFeatures = 0;
  var startFired = false;
  var reduceFired = false;

  tileReduce({
    bbox: [-122.05862045288086, 36.93768132842635, -121.97296142578124, 37.00378647456494],
    zoom: 15,
    map: path.join(__dirname, 'fixtures/count.js'),
    sources: [
      {name: 'osm', mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles')},
      {name: 'tiger', mbtiles: path.join(__dirname, '/fixtures/tiger.mbtiles')}
    ]
  })
  .on('start', function() {
    startFired = true;
  })
  .on('reduce', function(num) {
    numFeatures += num;
    reduceFired = true;
  })
  .on('end', function() {
    t.equal(numFeatures, 36597, 'found all features');
    t.equal(startFired, true, 'start fired');
    t.equal(reduceFired, true, 'reduce fired');
    t.end();
  });
});
