'use strict';

var queue = require('queue-async');
var q = queue();
var sources = [];
var tilesQueue = queue(1);

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

function processTile(tile, callback) {
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
      if (!results[i]) {
        callback(null);
        process.send({reduce: true});
        return;
      }
    }

    function gotResults(err, value) {
      if (err) throw err;
      process.send({reduce: true, value: value, tile: tile}, undefined, function() {
        callback(null);
      });
      if (process.versions.node.split('.')[0] < 4) // node/iojs prior to v4.0.0 don't have the callback to process.send above (instead the call is syncronous)
        callback(null);
    }

    map(data, tile, write, gotResults);
  }
}

process.on('message', function(tile) {
  tilesQueue.defer(processTile, tile);
});

function write(data, cb) {
  process.stdout.write((typeof data === 'string') ? data : JSON.stringify(data) + '\x1e', cb);
}
