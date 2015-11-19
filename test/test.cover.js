'use strict';

var test = require('tap').test;
var cover = require('../src/cover.js');

test('cover -- bbox', function(t) {
  var options = {
    zoom: 2,
    bbox: [-153, 33, -26, 82]
  };

  var tiles = cover(options);
  t.equal(tiles.length, 4, 'should be covered by 4 tiles');
  t.end();
});

test('cover -- geojson', function(t) {
  var options = {
    zoom: 2,
    geojson: {
      'type': 'Polygon',
      'coordinates': [
        [
          [-153, 33],
          [-153, 82],
          [-26, 82],
          [-26, 33],
          [-153, 33]
        ]
      ]
    }
  };

  var tiles = cover(options);
  t.equal(tiles.length, 4, 'should be covered by 4 tiles');
  t.end();
});

test('cover -- tiles', function(t) {
  var options = {
    zoom: 2,
    tiles: [
      [0, 0, 2],
      [0, 1, 2]
    ]
  };

  var tiles = cover(options);
  t.equal(tiles.length, 2, 'should be covered by 2 tiles');
  t.same(tiles, [
    [0, 0, 2],
    [0, 1, 2]
  ], 'should be the same as input tiles');
  t.end();
});

test('cover -- tiles & rezoom', function(t) {
  var options = {
    zoom: 2,
    tiles: [
      [0, 0, 1]
    ]
  };

  var tiles = cover(options);
  t.equal(tiles.length, 4, 'should be rezoomed to 4 tiles');
  t.equal(tiles[0][2], 2, 'tiles should be at zoom 2');
  t.end();
});

test('cover -- tile zoom is higher than expected', function(t) {
  var options = {
    zoom: 2,
    tiles: [
      [0, 0, 8]
    ]
  };
  t.throws(function() {
    cover(options);
  });

  t.end();
});

test('cover -- empty cover', function(t) {
  var options = {
    zoom: 2
  };
  t.equal(cover(options), null, 'cover without info options is null');

  t.end();
});
