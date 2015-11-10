'use strict';

var queue = require('queue-async');
var map = require(process.argv[2]);

var q = queue();
var sources = [];

JSON.parse(process.argv[3]).forEach(function(config) {
  q.defer(loadSource, config);
});

function loadSource(config, done) {
  if (config.mbtiles) config.getTile = require('./mbtiles')(config, done);
  else if (config.url) config.getTile = require('./remote')(config, done);
  else throw new Error('Unknown source type');
  sources.push(config);
}

q.await(function(err) {
  if (err) throw err;
  else process.send({ready: true});
});

process.on('message', function(tile) {
  var q = queue();

  for (var i = 0; i < sources.length; i++) {
    q.defer(getTile, tile, sources[i]);
  }

  q.awaitAll(gotData);

  function gotData(err, results) {
    if (err) throw err;

    var data = {};
    for (var i = 0; i < results.length; i++) {
      data[sources[i].name] = results[i];
      if (!results[i]) return process.send({reduce: true});
    }

    map(data, tile, gotResults);
  }
});

function getTile(tile, source, done) {
  if (source.maxzoom && source.maxzoom < tile[2]) {
    var m = 1 << (tile[2] - source.maxzoom);
    tile = [Math.floor(tile[0] / m), Math.floor(tile[1] / m), source.maxzoom];
  }
  return source.getTile(tile, done);
}

function gotResults(err, value) {
  if (err) throw err;
  process.send({reduce: true, value: value});
}
