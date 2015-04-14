var test = require('tape');
var TileReduce = require('../../');

test('mile count', function(t){
  var bbox = [
    13.425722,
    52.499556,
    13.484859,
    52.529016
  ];

  var opts = {
    zoom: 14,
    tileLayers: [
        {
          name: 'streets',
          url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
          layers: ['road', 'tunnel', 'bridge']
        }
      ],
    map: __dirname + '/miles.js'
  };

  var miles = 0;
  var tilereduce = TileReduce(bbox, opts);

  tilereduce.on('start', function(tiles){
    t.pass('tilereduce started');
    t.equal(tiles.length, 9, '9 tiles covered');
    var allValid = tiles.every(function(tile){
      return tile.length === 3;
    });
    t.true(allValid, 'all tiles are valid');
  });

  tilereduce.on('reduce', function(result){
    miles += result;
  });

  tilereduce.on('end', function(){
    var minMiles = 115;
    t.true(miles > minMiles, 'greater than ' + minMiles + ' miles of roads/paths (' + Math.round(miles * 100)/100 + ')');
    t.pass('tilereduce completed');
    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});
