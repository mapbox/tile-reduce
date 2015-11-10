'use strict';

var test = require('tap').test;
var remote = require('../src/remote');
var fs = require('fs');
var path = require('path');

test('remote - raw parse', function(t) {
  var osmUrl = 'https://b.tiles.mapbox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ';
  var source = {name: 'osm', url: osmUrl};
  var getTile = remote(source, function() {});

  getTile([5276, 12757, 15], function(err, layers) {
    t.notOk(err, 'remote VT unpacked without error');
    t.ok(layers, 'layers parsed from remote source');
    t.equal(
      JSON.stringify(layers),
      fs.readFileSync(path.join(__dirname, '/fixtures/osm-raw-parsed.json'), 'utf8'),
      'osm remote VT matches test fixture');
    t.end();
  });
});

test('remote - init', function(t) {
  var osmUrl = 'https://b.tiles.mapbox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ';
  var source = {name: 'osm', url: osmUrl};

  remote(source, function(err) {
    t.notOk(err, 'remote getTile init without error');
    t.end();
  });
});
