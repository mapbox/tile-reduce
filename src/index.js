'use strict';

module.exports = tileReduce;

var bboxPolygon = require('turf-bbox-polygon');
var normalize = require('geojson-normalize');
var fs = require('fs');
var tilecover = require('tile-cover');
var ProgressBar = require('progress');

var EventEmitter = require('events').EventEmitter;
var cpus = require('os').cpus().length;
var fork = require('child_process').fork;
var path = require('path');

function tileReduce(options) {
  var tiles = parseToTiles(options.area, options.zoom);
  var remaining = tiles.length;
  var workers = [];
  var workersReady = 0;
  var ee = new EventEmitter();
  var bar = new ProgressBar(':current / :total tiles (:percent), :elapseds elapsed [:bar] ', {total: remaining});

  for (var i = 0; i < cpus - 1; i++) {
    var worker = fork(path.join(__dirname, 'worker.js'), [options.map, JSON.stringify(options.sources)]);
    worker.on('message', handleMessage);
    workers.push(worker);
  }

  function handleMessage(message) {
    if (message.ready && ++workersReady === workers.length) run();
    else if (message.reduce !== undefined) {
      bar.tick();
      if (message.reduce !== null) ee.emit('reduce', message.reduce);
      if (--remaining === 0) shutdown();
    }
  }

  function shutdown() {
    while (workers.length) workers.pop().kill();
    ee.emit('end');
  }

  function run() {
    ee.emit('start', tiles);
    for (var i = 0; i < tiles.length; i++) {
      workers[i % workers.length].send(tiles[i]);
    }
  }

  return ee;
}

function parseToTiles(area, zoom) {
  var jobArea = area,
    poly = null;

  if (new RegExp('.json').test(area) ||
    new RegExp('.geojson').test(area)) {
    var jobArea = JSON.parse(fs.readFileSync(area));
  } 

  if (jobArea instanceof Array) {
    if (jobArea.length == 4 && typeof jobArea[0] === 'number') {
      // bbox
      poly = bboxPolygon(jobArea);
    } else if (jobArea.length === 3 && typeof jobArea[0] === 'number') {
      // [x,y,z] tile
      poly = tilebelt.tileToGeoJSON(jobArea);
      poly = turf.buffer(normalize(poly), -1, 'meters');
    } else if (jobArea.length > 0 && jobArea[0].length === 3) {
      // array of tiles!
      return jobArea;
    } else {
      throw new Error('Invalid job area');
    }
  } else {
    // geojson
    poly = jobArea;
  }

  return tilecover.tiles(normalize(poly).features[0].geometry, {min_zoom: zoom, max_zoom: zoom});
}
