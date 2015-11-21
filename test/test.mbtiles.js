'use strict';

var test = require('tap').test;
var mbtiles = require('../src/mbtiles');
var path = require('path');

test('mbtiles - raw parse', function(t) {
  var source = {
    name: 'osm',
    mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles'),
    raw: true
  };
  mbtiles(source, function(err, getTile) {
    t.notOk(err, 'osm.mbtiles getTiles init without error');

    getTile([5276, 12757, 15], function(err, layers) {
      t.notOk(err, 'osm.mbtiles unpacked without error');
      t.ok(layers, 'layers parsed from osm.mbtiles');
      t.equal(layers.buildings.length, 264, 'layers have correct number of buildings');
      t.equal(layers.roads.length, 384, 'layers have correct number of roads');
      t.end();
    });
  });
});

test('mbtiles - full GeoJSON parse', function(t) {
  var source = {
    name: 'osm',
    mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles')
  };
  mbtiles(source, function(err, getTile) {
    t.notOk(err, 'osm.mbtiles getTiles init without error');

    getTile([5276, 12757, 15], function(err, layers) {
      t.notOk(err, 'osm.mbtiles unpacked without error');
      t.ok(layers, 'layers parsed from osm.mbtiles');
      t.equal(layers.buildings.features.length, 264, 'layers have correct number of buildings');
      t.equal(layers.buildings.type, 'FeatureCollection', 'buildings decoded as GeoJSON FeatureCollection');
      t.equal(layers.buildings.features[0].geometry.type, 'Polygon', 'building decoded as GeoJSON Polygon');
      t.equal(layers.roads.features.length, 384, 'layers have correct number of roads');
      t.equal(layers.roads.type, 'FeatureCollection', 'roads decoded as GeoJSON FeatureCollection');
      t.equal(layers.roads.features[0].geometry.type, 'LineString', 'road decoded as GeoJSON LineString');
      t.end();
    });
  });
});

test('mbtiles - sparse GeoJSON parse', function(t) {
  var source = {
    name: 'osm',
    mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles'),
    layers: ['buildings']
  };
  mbtiles(source, function(err, getTile) {
    t.notOk(err, 'osm.mbtiles getTiles init without error');

    getTile([5276, 12757, 15], function(err, layers) {
      t.notOk(err, 'osm.mbtiles unpacked without error');
      t.ok(layers, 'layers parsed from osm.mbtiles');
      t.equal(layers.buildings.features.length, 264, 'layers have correct number of buildings');
      t.notOk(layers.roads, 'did not parse roads');
      t.end();
    });
  });
});

test('mbtiles - invalid path', function(t) {
  mbtiles({name: 'osm', mbtiles: path.join(__dirname, 'fixtures/tilelist')}, function(err) {
    t.ok(err, 'invalid mbtiles path returns error');
    t.end();
  });
});
