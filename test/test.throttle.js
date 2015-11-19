'use strict';

var test = require('tap').test;
var tileReduce = require('../src');
var path = require('path');

var sources = [
  {name: 'osm', url: 'https://b.tiles.mapbox.com/v4/morganherlocker.3vsvfjjw/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ', raw: true},
  {name: 'tiger', url: 'https://b.tiles.mapbox.com/v4/morganherlocker.4c81vjdd/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ', raw: true}
];

var mapPath = path.join(__dirname, 'fixtures/pass.js');

test('throttle 10 ops/sec', function(t) {
  var intervals = {};
  var maxrate = 10;
  tileReduce({
    bbox: [-122.05862045288086, 36.93768132842635, -121.97296142578124, 37.00378647456494],
    zoom: 15,
    map: mapPath,
    sources: sources,
    log: false,
    maxrate: maxrate
  })
  .on('reduce', function() {
    var now = new Date();
    var time = now.getMinutes() + ':' + now.getSeconds();
    if (!intervals[time]) intervals[time] = 1;
    else intervals[time]++;
  })
  .on('end', function() {
    Object.keys(intervals).forEach(function(interval) {
      if (intervals[interval] > limit*5)
        t.fail(intervals[interval] + ' ops/sec detected; should be ' + limit + ' ops/sec');
      else t.pass(intervals[interval] + ' ops/sec detected');
    });
    t.end();
  });
});
