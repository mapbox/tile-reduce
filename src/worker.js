'use strict';

const queue = require('queue-async');
const map = require(process.argv[2]);

const q = queue();
const sources = [];

JSON.parse(process.argv[3]).forEach((source) => q.defer(loadSource, source));

function loadSource(source, done) {
  const loaded = {name: source.name};
  sources.push(loaded);

  if (source.mbtiles) require('./mbtiles')(source, done);
  else if (source.url) require('./remote')(source, done);
  else throw new Error('Unknown source type');
}

q.awaitAll((err, results) => {
  if (err) throw err;
  for (let i = 0; i < results.length; i++) sources[i].getTile = results[i];
  process.send({ready: true});
});

process.on('message', (tile) => {
  const q = queue();

  for (let source of sources) q.defer(source.getTile, tile);

  q.awaitAll((err, results) => {
    if (err) throw err;

    const data = {};
    for (let i = 0; i < results.length; i++) {
      data[sources[i].name] = results[i];
      if (!results[i]) return process.send({reduce: true});
    }

    map(data, tile, write, (err, value) => {
      if (err) throw err;
      process.send({reduce: true, value: value, tile: tile});
    });
  });
});

function write(data) {
  process.stdout.write((typeof data === 'string') ? data : JSON.stringify(data));
  process.stdout.write('\x1e');
}
