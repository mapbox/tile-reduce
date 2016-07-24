'use strict';

var path = require('path');
var queue = require('queue-async');
var q = queue();
var sources = [];
var tilesQueue = queue(1);
var isOldNode = process.versions.node.split('.')[0] < 4;

var adapters = JSON.parse(process.argv[4]);
for (var key in adapters) {
  // eslint-disable-line global-require
  adapters[key] = require(adapters[key]);
}

global.mapOptions = JSON.parse(process.argv[5]);
var map = require(process.argv[2]);

JSON.parse(process.argv[3]).forEach(function(source) {
  q.defer(loadSource, source);
});


function loadSource(source, done) {
  /*eslint global-require: 0 */
  if (!adapters[source.type]) throw new Error('Unknown source type ' + source.type);

  var adapter = new adapters[source.type](source, done);
  adapter.name = source.name;
}

q.awaitAll(function(err, results) {
  if (err) throw err;
  sources = results;
  process.send({ready: true});
});

function processTile(tile, callback) {
  var q = queue();

  for (var i = 0; i < sources.length; i++) {
    q.defer(sources[i].getTile.bind(sources[i]), tile[2], tile[0], tile[1]);
  }

  q.awaitAll(gotData);

  function gotData(err, results) {
    if (err) throw err;

    var data = {};
    for (var i = 0; i < results.length; i++) {
      data[sources[i].name] = results[i];
      if (!results[i]) {
        callback();
        process.send({reduce: true});
        return;
      }
    }
    var writeQueue = queue(1);

    function write(data) {
      writeQueue.defer(writeStdout, (typeof data !== 'string' ? JSON.stringify(data) : data) + '\x1e');
    }

    function gotResults(err, value) {
      if (err) throw err;
      writeQueue.awaitAll(function() {
        process.send({reduce: true, value: value, tile: tile}, null, callback);
        if (isOldNode) callback(); // process.send is async since Node 4.0
      });
    }

    map(data, tile, write, gotResults);
  }
}

function writeStdout(str, cb) {
  process.stdout.write(str, cb);
}

process.on('message', function(tile) {
  tilesQueue.defer(processTile, tile);
});

