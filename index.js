var EventEmitter = require('events').EventEmitter;
var cover = require('tile-cover');
var turf = require('turf');
var fork = require('child_process').fork;
var cpus = require('os').cpus().length;

module.exports = function(coverArea, opts){
  var workersCompleted = 0;
  var ev = new EventEmitter;
  if(coverArea instanceof Array) coverArea = turf.bboxPolygon(coverArea)
  var tiles = cover.tiles(coverArea.geometry, {min_zoom: opts.zoom, max_zoom: opts.zoom});
  var workers = [];
  console.log(tiles)

  for (var i = 0; i < cpus; i++) {
    workers[i] = workers[i] || fork(__dirname + '/worker.js');
    workers[i].send({
      tiles: tiles
    });

    workers[i].on('message', function(message) {
      ev.emit('reduce', message);
    });

    workers[i].on('end', function() {
      workersCompleted++;
      if(workersCompleted >= cpus){
        ev.emit('reduce', message);
      }
    });

    workers[i].on('error', function(err) {
      ev.emit('error', err);
    });
  }
}
