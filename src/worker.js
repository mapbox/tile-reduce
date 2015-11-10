'use strict';

var queue = require('queue-async');
var map = require(process.argv[2]);

var q = queue();
var sources = [];

JSON.parse(process.argv[3]).forEach(function(source) {
  q.defer(loadSource, source);
});

function loadSource(source, done) {
  if (source.mbtiles) sources.push({name: source.name, getTile: require('./mbtiles')(source, done)});
  else if (source.url) sources.push({name: source.name, getTile: require('./remote')(source, done)});
  else throw new Error('Unknown source type');
}

q.await(function(err) {
  if (err) throw err;
  else process.send({ready: true});
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

    map(data, tile, gotResults);
  }
});

function gotResults(err, value) {
  if (err) throw err;
  process.send({reduce: true, value: value});
}
