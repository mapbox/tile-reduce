'use strict';

var test = require('tap').test;
var tileReduce = require('../src');
var path = require('path');

var sources = [
  {name: 'osm', mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles'), raw: true}
];

var mapPath = path.join(__dirname, 'fixtures/invalid_syntax.js');

test('errors', function(t) {

  t.throws(function() {
    tileReduce({
      bbox: [-122.05862045288086, 36.93768132842635, -121.97296142578124, 37.00378647456494],
      zoom: 15,
      map: mapPath,
      sources: sources,
      log: false
    });
  }, SyntaxError, 'good errors for bad syntax');

  t.throws(function() {
    tileReduce({
      bbox: [-122.05862045288086, 36.93768132842635, -121.97296142578124, 37.00378647456494],
      zoom: 15,
      map: 'does not exist',
      sources: sources,
      log: false
    });
  }, Error, 'good errors for bad file names');

  t.end();
});
