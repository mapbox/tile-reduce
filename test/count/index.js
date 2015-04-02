var test = require('tape');
var mapreduce = new require('vt-mapreduce')();
var count = require('./count.js');
var turf = require('turf');

test('count', function(t){
  var bbox = [-77.05810546875,
      38.913475954379756,
      -77.04608917236328,
      38.92282516381189];

  var opts = {
    zoom: 12,
    tileLayers: [
        {
          name: 'streets',
          url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
          layers: ['road']
        }
      ],
    map: count
  };

  var totalLines = 0;
  mapreduce.on('start', function(tiles){
    t.ok('mapreduce started')
    t.true(tiles.length > 0);
    tiles.forEach(function(tile) {
      t.equal(tile[0].length, 3);
    });
  });

  mapreduce.on('reduce', function(result, tile){
    totalLines += result;
  });

  mapreduce.on('end', function(error){
    t.ok('mapreduce completed')
    t.end();
  });

  mapreduce.on('error', function(error){
    throw error;
  });

  mapreduce(bbox, opts);
});