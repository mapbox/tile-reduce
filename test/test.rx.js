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

test('count implementation, tileStream cover', function(t) {
  var numFeatures = 0;

  tileReduce({
    tileStream: fs.createReadStream(path.join(__dirname, 'fixtures/tilelist')).pipe(split()),
    zoom: 15,
    map: mapPath,
    sources: sources,
    log: false
  })
  .filter(function(event) { return event.type === 'processed'; })
  .map(function(event) { return event.value; })
  .sum()
  .subscribe(function(res) {
    t.equal(res, 16182);
    t.end();
  });
});
