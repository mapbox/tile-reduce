'use strict';

var test = require('tap').test;
var mbtiles = require('../src/mbtiles');
var fs = require('fs');
var path = require('path');

test('mbtiles - raw parse', function(t) {
  var source = {name: 'osm', mbtiles: path.join(__dirname, '/fixtures/osm.mbtiles')};
  var getTile = mbtiles(source, function(err) {
    t.notOk(err, 'osm.mbtiles getTiles init without error');
    getTile([5276, 12757, 15], function(err, layers) {
      t.notOk(err, 'osm.mbtiles unpacked without error');
      t.ok(layers, 'layers parsed from osm.mbtiles');
      t.equal(JSON.stringify(layers), fs.readFileSync(path.join(__dirname, '/fixtures/osm-raw-parsed.json'), 'utf8'));
      t.end();
    });
  });
});
