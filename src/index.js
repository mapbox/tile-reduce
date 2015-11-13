'use strict';

module.exports = tileReduce;

var EventEmitter = require('events').EventEmitter;
var cpus = require('os').cpus().length;
var fork = require('child_process').fork;
var path = require('path');
var fs = require('fs');
var binarysplit = require('binary-split');
var cover = require('./cover');
var streamArray = require('stream-array');
var MBTiles = require('mbtiles');

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

  process.stderr.write('Starting up ' + cpus + ' workers... ');

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
  var timer;

  function run() {
    process.stderr.write('Job started.\n');

    ee.emit('start');
    timer = setInterval(updateStatus, 64);

    var tiles = cover(options);

    if (tiles) {
      // JS tile array, GeoJSON or bbox
      process.stderr.write('Processing ' + tiles.length + ' tiles.\n');
      tileStream = streamArray(tiles).on('data', handleTile);

    } else if (typeof options.tiles === 'string') {
      // text file tile stream ("x y z\n")
      process.stderr.write('Processing tile coords from ' + path.basename(options.tiles) + '.\n');
      tileStream = fs.createReadStream(options.tiles);
      tileStream.pipe(binarysplit()).on('data', handleTileLine);

    } else {
      // try to automatically get tiles from mbtiles
      var source;
      for (var i = 0; i < options.sources.length; i++) {
        if (options.sources[i].mbtiles) {
          source = options.sources[i];
          break;
        }
      }
      if (source) {
        process.stderr.write('Processing tile coords from "' + source.name + '" source.\n');
        var db = new MBTiles(source.mbtiles, function(err) {
          if (err) throw err;
          tileStream = db.createZXYStream().pipe(binarysplit()).on('data', handleZXYLine);
        });

      } else {
        throw new Error('No area or tiles specified for the job.');
      }
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

  function handleTileLine(line) {
    handleTile(line.toString().split(' ').map(Number));
  }

  function handleZXYLine(line) {
    var tile = line.toString().split('/');
    handleTile([+tile[1], +tile[2], +tile[0]]);
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
    if (!process.stderr.cursorTo) return;

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
