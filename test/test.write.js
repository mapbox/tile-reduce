'use strict';

var test = require('tap').test;
var tileReduce = require('../src');
var path = require('path');
var through2 = require('through2');

test('count implementation, tileStream cover', function(t) {

  var tilesDone = 0;

  var tiles = [];
  for (var i = 0; i < 2000; i++) {
    tiles.push([5276, 12757, 15]);
  }

  var output = through2();

  tileReduce({
    tiles: tiles,
    zoom: 15,
    map: path.join(__dirname, 'fixtures/write.js'),
    sources: [{name: 'osm', mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles'), raw: true}],
    log: false,
    output: output,
    batch: 100
  })
  .on('reduce', function() {
    tilesDone++;
  })
  .on('end', function() {
    t.equal(tilesDone, tiles.length, 'processed all tiles');
  });

  var outputStr = '[';

  output.on('data', function(str) {
    outputStr += str;

  }).on('end', function() {
    outputStr += '{}]';

    t.doesNotThrow(function() {
      JSON.parse(outputStr);
    }, 'produced valid JSON output');

    t.end();
  });
});
