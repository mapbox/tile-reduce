'use strict';

var test = require('tap').test;
var tileReduce = require('../src');
var path = require('path');
var fs = require('fs');
var split = require('split');

var sources = [
  {name: 'osm', mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles'), raw: true},
  {name: 'tiger', mbtiles: path.join(__dirname, '/fixtures/tiger.mbtiles'), raw: true}
];

var remoteSources = [
  {name: 'osm', url: 'https://b.tiles.mapbox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ', raw: true},
  {name: 'tiger', url: 'https://b.tiles.mapbox.com/v4/morganherlocker.4c81vjdd/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ', raw: true}
];

var mapPath = path.join(__dirname, 'fixtures/count.js');

test('count implementation, bbox cover', function(t) {
  var numFeatures = 0;

  tileReduce({
    bbox: [-122.05862045288086, 36.93768132842635, -121.97296142578124, 37.00378647456494],
    zoom: 15,
    map: mapPath,
    sources: sources,
    log: false
  })
  .on('reduce', function(num) {
    numFeatures += num;
  })
  .on('end', function() {
    t.equal(numFeatures, 16182, 'found all features in given bbox');
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

test('count implementation, explicit mbtiles cover', function(t) {
  var numFeatures = 0;

  tileReduce({
    zoom: 15,
    map: mapPath,
    sources: sources,
    sourceCover: 'tiger',
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

  tileReduce({
    tileStream: fs.createReadStream(path.join(__dirname, 'fixtures/tilelist')).pipe(split()),
    zoom: 15,
    map: mapPath,
    sources: sources,
    log: false
  })
  .on('reduce', function(num) {
    numFeatures += num;
  })
  .on('end', function() {
    t.equal(numFeatures, 16182, 'found all features in listed tiles');
    t.end();
  });
});

test('count implementation, remote sources', function(t) {
  var numFeatures = 0;

  tileReduce({
    tiles: [[5276, 12757, 15]],
    zoom: 15,
    map: mapPath,
    sources: remoteSources,
    log: false
  })
  .on('reduce', function(num) {
    numFeatures += num;
  })
  .on('end', function() {
    t.equal(numFeatures, 857, 'found all features in listed tiles');
    t.end();
  });
});
