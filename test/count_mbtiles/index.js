var test = require('tape');
var TileReduce = require('../../');

test('feature count', function(t){
  var bbox = [4293,6022,14];

  var opts = {
    zoom: 15,
    tileLayers: [
        {
          name: 'osm',
          mbtiles: __dirname + 'mi-14-4293-6022.mbtiles',
          layers: ['migeojson']
        }
      ],
    map: __dirname+'/count.js'
  };

  var totalLines = 0;
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
    totalLines += result;
  });

  tilereduce.on('end', function(){
    t.true(totalLines > 1000, 'should be > 1000 lines');
    t.pass('tilereduce completed');
    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});
