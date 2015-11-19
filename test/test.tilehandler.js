'use strict';

var test = require('tap').test;
var TileHandler = require('../src/tilehandler');
var streamArray = require('stream-array');

test('TileHandler', function(t) {
  var maxrate = null;
  var pauseLimit = 1000;
  var tilesSent = 0;
  var workers = [
    {
      send: function(tile) {
        if (tile.length === 3) tilesSent++;
      }
    }
  ];
  var tiles = [
    [0, 0, 2],
    [0, 1, 2]
  ];
  var tileStream = null;
  var handler = new TileHandler(workers, tileStream, pauseLimit, maxrate);

  tileStream = streamArray(tiles).on('data', handler.handleTile);
  t.equal(typeof handler.handleTile, 'function', 'TileHandler instantiated');
  t.end();
});
