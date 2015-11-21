'use strict';

var test = require('tap').test;
var tileReduce = require('../src');
var path = require('path');

var sources = [
  {name: 'osm', mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles'), raw: true},
  {name: 'tiger', mbtiles: path.join(__dirname, '/fixtures/tiger.mbtiles'), raw: true}
];

var mapPath = path.join(__dirname, 'fixtures/count.js');

test('events', function(t) {
  var mapsCalled = 0;
  var reducesCalled = 0;
  var startCalled = 0;

  tileReduce({
    tiles: [[5289, 12749, 15]],
    zoom: 15,
    map: mapPath,
    sources: sources,
    log: false
  })
  .on('start', function() {
    startCalled++;
  })
  .on('map', function(tile) {
    t.deepEqual(tile, [5289, 12749, 15], 'map event should receive tile');
    mapsCalled++;
  })
  .on('reduce', function(result, tile) {
    t.equal(result, 2, 'reduce event should receive result');
    t.deepEqual(tile, [5289, 12749, 15], 'reduce event should receive tile');
    reducesCalled++;
  })
  .on('end', function() {
    t.equal(startCalled, 1, 'start should have been called once');
    t.equal(mapsCalled, 1, 'map should have been called once');
    t.equal(reducesCalled, 1, 'reduce should have been called once');
    t.end();
  });
});
