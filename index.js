var EventEmitter = require("events").EventEmitter;
var cover = require('tile-cover');
var turf = require('turf');
var fork = require('child_process').fork;
var cpus = require('os').cpus().length;

module.exports = function (coverArea, opts){
  var workers = [];
  var tilesCompleted = 0;
  var ee = new EventEmitter();
  if(coverArea instanceof Array) coverArea = turf.bboxPolygon(coverArea);
  var tiles = cover.tiles(coverArea.geometry, {min_zoom: opts.zoom, max_zoom: opts.zoom});

  setTimeout(function(){
    ee.emit('tiles', tiles);
  }, 0);

  for (var i = 0; i < cpus; i++) {
    workers[i] = workers[i] || fork(__dirname + '/worker.js');
    workers[i].on('message', function(message) {
      ee.emit('reduce', message);
      tilesCompleted++;
      if(tilesCompleted >= tiles.length){
        while (workers.length) {
          workers.shift().kill('SIGHUP');
        }
        ee.emit('end');
      }
    });

    workers[i].on('error', function(err) {
      ee.emit('error', err);
    });
  }

  ee.run = function () {
    var chunks = [];
    for (var i = 0; i < cpus; i++) {
      chunks.push([]);
    }
    tiles.forEach(function(tile, i){
      chunks[i % cpus].push(tile);
    });
    for (var i = 0; i < cpus; i++) {
      workers[i].send({
        tiles: chunks[i % cpus],
        opts: opts
      });
    }
  }

  return ee;
}

