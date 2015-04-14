var test = require('tape');
var TileReduce = require('../../');
var count = require('./disconnect.js');
var turf = require('turf');
var fs = require('fs');

test('disconnect', function(t){
  var bbox = [
    -77.16350555419922,
    38.81135594620186,
    -76.9379425048828,
    38.965815660189016
    ];

  var opts = {
    zoom: 15,
    tileLayers: [
        {
          name: 'streets',
          url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
          layers: ['road', 'bridge', 'tunnel']
        }
      ],
    map: __dirname+'/disconnect.js'
  };

  var tilereduce = TileReduce(bbox, opts);

  var geojson = turf.featurecollection([]);

  tilereduce.on('start', function(tiles){
    t.pass('tilereduce started');
    t.equal(tiles.length, 399, '399 tiles covered');
    var allValid = tiles.every(function(tile){
      return tile.length === 3;
    });
    t.true(allValid, 'all tiles are valid');
  });

  tilereduce.on('reduce', function(result, tile){
    geojson.features = geojson.features.concat(result.features);
  });

  tilereduce.on('end', function(){
    t.true(geojson.features.length > 0, 'disconnects had features');
    var allPoints = true;
    geojson.features.forEach(function(pt){
      if(pt.geometry.type !== 'Point'){
        allPoints = false;
      }
    });
    t.true(allPoints, 'all disconnect features were points');

    fs.writeFileSync(__dirname+'/out.geojson', JSON.stringify(geojson));
    t.pass('tilereduce completed');

    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});
