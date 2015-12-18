'use strict';

var queue = require('queue-async');
var q = queue();
var sources = [];

global.mapOptions = JSON.parse(process.argv[4]);
var map = require(process.argv[2]);

JSON.parse(process.argv[3]).forEach(function(source) {
  q.defer(loadSource, source);
});

function loadSource(source, done) {
  var loaded = {name: source.name};
  sources.push(loaded);

  if (source.mbtiles) require('./mbtiles')(source, done);
  else if (source.url) require('./remote')(source, done);
  else throw new Error('Unknown source type');
}

q.awaitAll(function(err, results) {
  if (err) throw err;
  for (var i = 0; i < results.length; i++) sources[i].getTile = results[i];
  process.send({ready: true});
});

process.on('message', function(tile) {
  var q = queue();

  for (var i = 0; i < sources.length; i++) {
    q.defer(sources[i].getTile, tile);
  }

  q.awaitAll(gotData);

  function gotData(err, results) {
    if (err) throw err;

    var data = {};
    for (var i = 0; i < results.length; i++) {
      data[sources[i].name] = results[i];
      if (!results[i]) return process.send({reduce: true});
    }

    function gotResults(err, value) {
      if (err) throw err;
      process.send({reduce: true, value: value, tile: tile});
    }

    map(data, tile, write, gotResults);
  }
});

function write(data) {
  process.stdout.write((typeof data === 'string') ? data : JSON.stringify(data));
  process.stdout.write('\x1e');
}
