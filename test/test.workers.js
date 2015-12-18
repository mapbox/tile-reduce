'use strict';

var test = require('tap').test;
var tileReduce = require('../src');
var path = require('path');
var maxCpus = require('os').cpus().length;

var sources = [
  {name: 'osm', mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles'), raw: true},
  {name: 'tiger', mbtiles: path.join(__dirname, '/fixtures/tiger.mbtiles'), raw: true}
];

var mapPath = path.join(__dirname, 'fixtures/count.js');

test('workers - 1 per cpu default', function(t) {
  tileReduce({
    zoom: 15,
    map: mapPath,
    sources: sources,
    sourceCover: 'tiger',
    log: false
  })
  .on('start', function() {
    t.equal(this.workers.length, maxCpus, 'One worker per CPU initialized');
  })
  .on('end', function() {
    t.end();
  });
});

test('workers - maxWorker limit is enforced', function(t) {
  tileReduce({
    zoom: 15,
    map: mapPath,
    sources: sources,
    sourceCover: 'tiger',
    log: false,
    maxWorkers: 1
  })
  .on('start', function() {
    t.equal(this.workers.length, 1, 'Only one worker initialized');
  })
  .on('end', function() {
    t.end();
  });
});

test('workers - maxWorker limit can\'t exceed CPUs', function(t) {
  tileReduce({
    zoom: 15,
    map: mapPath,
    sources: sources,
    sourceCover: 'tiger',
    log: false,
    maxWorkers: maxCpus + 4
  })
  .on('start', function() {
    t.equal(this.workers.length, maxCpus, 'Workers can\'t exceed CPUs');
  })
  .on('end', function() {
    t.end();
  });
});

test('workers - have access to mapOptions', function(t) {
  var mapOpts = {
    option1: true,
    option2: 5
  };
  var reduceCount = 0;

  tileReduce({
    zoom: 15,
    tiles: [
      [5282, 12755, 15]
    ],
    sources: sources,
    mapOptions: mapOpts,
    map: path.join(__dirname, 'fixtures/mapOptions.js'),
    log: false
  })
  .on('reduce', function(result) {
    reduceCount++;
    t.deepEqual(mapOpts, result, 'Worker mapOptions are the same as input options');
  })
  .on('end', function() {
    t.equal(reduceCount, 1, 'One tile reduced');
    t.end();
  });
});
