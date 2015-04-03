var cover = require('tile-cover');
var bboxPolygon = require('turf-bbox-polygon');
var fork = require('child_process').fork;
var cpus = require('os').cpus().length;

module.exports = function(coverArea, opts){
  var tiles = cover.tiles(coverArea.geometry, {min_zoom: opts.zoom, max_zoom: opts.zoom});
  var workers = [];

  for (var i = 0; i < cpus; i++) {
    workers[i] = workers[i] || fork(__dirname + '/worker.js');
    workers[i].send({
      tiles: 
    });

    workers[i].on('message', function(message) {

    });
  }
}
