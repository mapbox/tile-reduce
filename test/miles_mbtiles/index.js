var test = require('tape');
var TileReduce = require('../../');

test('mile count', function(t){
  var bbox = [4293,6022,14];

  var opts = {
    zoom: 15,
    tileLayers: [
        {
          name: 'streets',
          mbtiles: __dirname + '/mi-14-4293-6022.mbtiles',
          layers: ['migeojson']
        }
      ],
    map: __dirname + '/miles_mbtiles.js'
  };

  var miles = 0;
  var tilereduce = TileReduce(bbox, opts);

  tilereduce.on('start', function(tiles){
    t.pass('tilereduce started');
    t.equal(tiles.length, 4, '4 tiles covered');
    var allValid = tiles.every(function(tile){
      return tile.length === 3;
    });
    t.true(allValid, 'all tiles are valid');
  });

  tilereduce.on('reduce', function(result){
    miles += result;
  });

  tilereduce.on('end', function(){
    var minMiles = 6;
    t.true(miles > minMiles, 'greater than ' + minMiles + ' miles of roads/paths (' + Math.round(miles * 100)/100 + ')');
    t.pass('tilereduce completed');
    t.end();
    console.log(miles);
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});
