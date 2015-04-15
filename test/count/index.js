var test = require('tape');
var TileReduce = require('../../');

test('road count', function(t){
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
    t.pass('tilereduce started');
    t.equal(tiles.length, 12, '12 tiles covered');
    var allValid = tiles.every(function(tile){
      return tile.length === 3;
    });
    t.true(allValid, 'all tiles are valid');
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
