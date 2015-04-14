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
    t.equal(tiles.length, 12, '12 tiles covered');
    tiles.forEach(function(tile) {
      t.equal(tile.length, 3, 'valid tile');
    });
  });

  tilereduce.on('reduce', function(result){
    totalLines += result;
  });

  tilereduce.on('end', function(){
    t.true(totalLines > 25000, 'should be > 25000 lines');
    t.pass('tilereduce completed');
    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});
