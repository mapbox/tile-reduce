var test = require('tape');
var TileReduce = require('../../');
var count = require('./count.js');
var turf = require('turf');

test('count', function(t){
  var bbox = [
    -77.16350555419922,
    38.81135594620186,
    -76.9379425048828,
    38.965815660189016
    ];

  var opts = {
    zoom: 12,
    tileLayers: [
        {
          name: 'streets',
          url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
          layers: ['road']
        }
      ],
    map: __dirname+'/count.js'
  };

  var totalLines = 0;
  var tilereduce = TileReduce(bbox, opts);

  tilereduce.on('start', function(tiles){
    console.log('STARTED')
    t.pass('tilereduce started');
    t.true(tiles.length > 0);
    tiles.forEach(function(tile) {
      t.equal(tile[0].length, 3);
    });
  });

  tilereduce.on('tiles', function(tiles){
    t.equal(tiles.length, 12)
    t.true(tiles.length > 0);
    tiles.forEach(function(tile) {
      t.equal(tile.length, 3);
    });
  });

  tilereduce.on('reduce', function(result, tile){
    totalLines += result;
  });

  tilereduce.on('end', function(error){
    t.equal(totalLines, 26707, 'should be 26707 lines')
    t.pass('tilereduce completed');
    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});