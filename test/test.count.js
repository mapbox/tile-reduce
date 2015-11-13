'use strict';

var test = require('tap').test;
var tileReduce = require('../src');
var path = require('path');
var fs = require('fs');
var split = require('binary-split');

var sources = [
  {name: 'osm', mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles'), raw: true},
  {name: 'tiger', mbtiles: path.join(__dirname, '/fixtures/tiger.mbtiles'), raw: true}
];

var mapPath = path.join(__dirname, 'fixtures/count.js');

test('count implementation, bbox cover', function(t) {
  var numFeatures = 0;
  var startFired = false;
  var reduceFired = false;

  tileReduce({
    bbox: [-122.05862045288086, 36.93768132842635, -121.97296142578124, 37.00378647456494],
    zoom: 15,
    map: mapPath,
    sources: sources,
    log: false
  })
  .on('start', function() {
    startFired = true;
  })
  .on('reduce', function(num) {
    numFeatures += num;
    reduceFired = true;
  })
  .on('end', function() {
    t.equal(numFeatures, 16182, 'found all features in given bbox');
    t.equal(startFired, true, 'start fired');
    t.equal(reduceFired, true, 'reduce fired');
    t.end();
  });
});

test('count implementation, mbtiles cover', function(t) {
  var numFeatures = 0;

  tileReduce({
    zoom: 15,
    map: mapPath,
    sources: sources,
    log: false
  })
  .on('reduce', function(num) {
    numFeatures += num;
  })
  .on('end', function() {
    t.equal(numFeatures, 36597, 'found all features in overlapping mbtiles');
    t.end();
  });
});

test('count implementation, tileStream cover', function(t) {
  var numFeatures = 0;
  var startFired = false;
  var reduceFired = false;

  tileReduce({
    tileStream: fs.createReadStream(path.join(__dirname, 'fixtures/tilelist')).pipe(split()),
    zoom: 15,
    map: mapPath,
    sources: sources,
    log: false
  })
  .on('start', function() {
    startFired = true;
  })
  .on('reduce', function(num) {
    numFeatures += num;
    reduceFired = true;
  })
  .on('end', function() {
    t.equal(numFeatures, 16182, 'found all features in listed tiles');
    t.equal(startFired, true, 'start fired');
    t.equal(reduceFired, true, 'reduce fired');
    t.end();
  });
});
