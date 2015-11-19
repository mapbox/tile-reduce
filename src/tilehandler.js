'use strict';

var rateLimit = require('function-rate-limit');

var TileHandler = function(workers, tileStream, pauseLimit, maxrate) {
  this.workers = workers;
  this.tileStream = tileStream;
  this.pauseLimit = pauseLimit;
  this.maxrate = maxrate;
  this.tilesDone = 0;
  this.tilesSent = 0;
  this.paused = false;

  this.handleTile = function(tile) {
    if(workers.length < 1) throw new Error('No workers initialized.');
    if(!tileStream) throw new Error('No tilestream initialized.');
    this.workers[this.tilesSent++ % this.workers.length].send(tile);
    if (!this.paused && this.tilesSent - this.tilesDone > this.pauseLimit) {
      this.paused = true;
      this.tileStream.pause();
    }
  }
  if(this.maxrate) this.handleTile = rateLimit(maxrate, 1000, this.handleTile);
}

module.exports = TileHandler;