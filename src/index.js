'use strict';

module.exports = tileReduce;

var EventEmitter = require('events').EventEmitter;
var cpus = require('os').cpus().length;
var fork = require('child_process').fork;
var path = require('path');
var fs = require('fs');
var split = require('split');
var binarysplit = require('binary-split');
var cover = require('./cover');
var streamArray = require('stream-array');

var tileTransform = split(function(line) {
  return line.split(' ').map(Number);
});

// Suppress max listener warnings. We need 1 pipe per worker
process.stdout.setMaxListeners(cpus + 1);
process.stderr.setMaxListeners(cpus + 1);

function tileReduce(options) {
  var workers = [];
  var workersReady = 0;
  var tileStream = null;
  var tilesDone = 0;
  var tilesSent = 0;
  var pauseLimit = 5000;
  var start = Date.now();

  for (var i = 0; i < cpus; i++) {
    var worker = fork(path.join(__dirname, 'worker.js'), [options.map, JSON.stringify(options.sources)], {silent: true});
    worker.stdout.pipe(binarysplit('\x1e')).pipe(process.stdout);
    worker.stderr.pipe(process.stderr);
    worker.on('message', handleMessage);
    workers.push(worker);
  }

  function handleMessage(message) {
    if (message.reduce) reduce(message.value);
    else if (message.ready && ++workersReady === workers.length) run();
  }

  var ee = new EventEmitter();
  var tiles = typeof options.tiles === 'string' ? null : cover(options);

  var timer = setInterval(updateStatus, 64);

  function run() {
    ee.emit('start');

    if (tiles) {
      tileStream = streamArray(tiles).on('data', handleTile);
    } else {
      tileStream = fs.createReadStream(options.tiles);
      tileStream.pipe(tileTransform).on('data', handleTile);
    }
  }

  var paused = false;

  function handleTile(tile) {
    workers[tilesSent++ % workers.length].send(tile);
    if (!paused && tilesSent - tilesDone > pauseLimit) {
      paused = true;
      tileStream.pause();
    }
  }

  function reduce(value) {
    if (value !== null && value !== undefined) ee.emit('reduce', value);
    if (paused && tilesSent - tilesDone < (pauseLimit / 2)) {
      paused = false;
      tileStream.resume();
    }
    if (++tilesDone === tilesSent) shutdown();
  }

  function shutdown() {
    while (workers.length) workers.pop().kill();

    clearTimeout(timer);
    updateStatus();
    process.stderr.write('.\n');

    ee.emit('end');
  }

  function updateStatus() {
    var s = Math.floor((Date.now() - start) / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s - h * 3600) / 60);
    var time = (h ? h + 'h ' : '') + (h || m ? m + 'm ' : '') + (s % 60) + 's';

    process.stderr.cursorTo(0);
    process.stderr.write(tilesDone + ' tiles processed in ' + time);
    process.stderr.clearLine(1);
  }

  return ee;
}
