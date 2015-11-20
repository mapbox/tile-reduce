'use strict';

var test = require('tap').test;
var remote = require('../src/remote');
var queue = require('queue-async');

test('remote - raw parse', function(t) {
  var osmUrl = 'https://b.tiles.mapbox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ';
  var source = {
    name: 'osm',
    url: osmUrl,
    raw: true
  };
  remote(source, function(err, getTile) {
    t.notOk(err, 'remote initialized without error');
    getTile([5276, 12757, 15], function(err, layers) {
      t.notOk(err, 'remote VT unpacked without error');
      t.ok(layers, 'layers parsed from remote source');
      t.equal(layers.buildings.length, 264, 'layers have correct number of buildings');
      t.equal(layers.roads.length, 384, 'layers have correct number of roads');
      t.end();
    });
  });
});

test('remote - full GeoJSON parse', function(t) {
  var osmUrl = 'https://b.tiles.mapbox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ';
  var source = {
    name: 'osm',
    url: osmUrl
  };
  remote(source, function(err, getTile) {
    t.notOk(err, 'remote initialized without error');
    getTile([5276, 12757, 15], function(err, layers) {
      t.notOk(err, 'remote unpacked without error');
      t.ok(layers, 'layers parsed from remote');
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

test('remote - sparse GeoJSON parse', function(t) {
  var osmUrl = 'https://b.tiles.mapbox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ';
  var source = {
    name: 'osm',
    url: osmUrl,
    layers: ['buildings']
  };
  remote(source, function(err, getTile) {
    t.notOk(err, 'remote initialized without error');
    getTile([5276, 12757, 15], function(err, layers) {
      t.notOk(err, 'remote unpacked without error');
      t.ok(layers, 'layers parsed from remote');
      t.equal(layers.buildings.features.length, 264, 'layers have correct number of buildings');
      t.notOk(layers.roads);
      t.end();
    });
  });
});

test('remote - init', function(t) {
  var osmUrl = 'https://b.tiles.mapbox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ';
  var source = {name: 'osm', url: osmUrl};

  remote(source, function(err, getTile) {
    t.notOk(err, 'remote getTile init without error');
    t.ok(typeof getTile === 'function', 'remote getTile is a function');
    t.end();
  });
});

test('remote - raw invalid url - 401', function(t) {
  var badUrl = 'https://b.tiles.mapbox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}.vector.pbf';
  var source = {name: 'osm', url: badUrl};
  remote(source, function(err, getTile) {
    t.notOk(err, 'remote initialized without error');
    getTile([5276, 12757, 15], function(err, layers) {
      t.notOk(err, 'does not return an error with a missing tile remote url');
      t.notOk(layers, 'does not return layers with a missing tile remote url');
      t.end();
    });
  });
});

test('remote - raw invalid url - no server', function(t) {
  var badUrl = 'https://tiles.mapox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}.vector.pbf';
  var source = {name: 'osm', url: badUrl};
  remote(source, function(err, getTile) {
    t.notOk(err, 'remote initialized without error');
    getTile([5276, 12757, 15], function(err, layers) {
      t.ok(err, 'returns an error with a bad remote url');
      t.ok(err.message.indexOf('getaddrinfo ENOTFOUND') === 0, 'HTTP address not found');
      t.notOk(layers, 'does not return layers with a bad remote url');
      t.end();
    });
  });
});

test('remote - throttle', function(t) {
  var url = url = 'https://b.tiles.mapbox.com/v4/morganherlocker.4c81vjdd/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ';
  var maxrate = 5;
  var tile = [5276, 12757, 15];
  var source = {name: 'osm', url: url, maxrate: maxrate};
  var intervals = {};
  var q = queue(100);

  remote(source, function(err, getTile) {
    t.notOk(err, 'remote initialized without error');

    for (var i = 0; i < 100; i++) {
      q.defer(request);
    }

    q.awaitAll(function() {
      Object.keys(intervals).forEach(function(interval) {
        if (intervals[interval] > maxrate * 3)
          t.fail(intervals[interval] + ' ops/sec detected; should be ' + maxrate + ' ops/sec');
        else t.pass(intervals[interval] + ' ops/sec detected');
      });
      t.end();
    });

    function request(cb) {
      getTile(tile, function(err) {
        if (err) t.error(err);

        var now = new Date();
        var time = now.getMinutes() + ':' + now.getSeconds();
        if (!intervals[time]) intervals[time] = 1;
        else intervals[time]++;
        cb();
      });
    }
  });
});
