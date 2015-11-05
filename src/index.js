'use strict';

module.exports = tileReduce;

var ProgressBar = require('progress');

var EventEmitter = require('events').EventEmitter;
var cpus = require('os').cpus().length;
var fork = require('child_process').fork;
var path = require('path');
var fs = require('fs');
var split = require('split');
var cover = require('./cover');
var streamArray = require('stream-array');

var tileTransform = split(function(line) {
  return line.split(' ').map(Number);
});

function tileReduce(options) {
  var workers = [];
  var workersReady = 0;
  var tileStream = null;
  var tilesDone = 0;
  var tilesSent = 0;
  var pauseLimit = 5000;

  for (var i = 0; i < cpus - 1; i++) {
    var worker = fork(path.join(__dirname, 'worker.js'), [options.map, JSON.stringify(options.sources)]);
    worker.on('message', handleMessage);
    workers.push(worker);
  }

  function handleMessage(message) {
    if (message.reduce) reduce(message.value);
    else if (message.ready && ++workersReady === workers.length) run();
  }

  var bar = new ProgressBar(':current / :total tiles (:percent), :elapseds elapsed [:bar] ', {
    total: 1,
    width: Infinity
  });
  bar.tick(0);

  var ee = new EventEmitter();
  var tiles = typeof options.tiles === 'string' ? null : cover(options);


  function run() {
    ee.emit('start');

    if (tiles) {
      tileStream = streamArray(tiles).on('data', handleTile);
      bar.total = tiles.length;
      bar.tick(0);
    } else {
      tileStream = fs.createReadStream(options.tiles);
      tileStream.pipe(tileTransform).on('data', handleTile);
    }
  }

  function handleTile(tile) {
    workers[tilesSent++ % workers.length].send(tile);
    if (!tileStream.isPaused() && tilesSent - tilesDone > pauseLimit) tileStream.pause();
    if (bar.total < tilesSent) {
      bar.total = tilesSent;
      bar.tick(0);
    }
  }

  function reduce(value) {
    bar.tick();
    if (value !== null && value !== undefined) ee.emit('reduce', value);
    if (tileStream.isPaused() && tilesSent - tilesDone < (pauseLimit / 2)) tileStream.resume();
    if (++tilesDone === tilesSent) shutdown();
  }

  function shutdown() {
    while (workers.length) workers.pop().kill();
    ee.emit('end');
  }

  return ee;
}
