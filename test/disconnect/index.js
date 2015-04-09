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
          layers: ['road', 'bridge']
        }
      ],
    map: __dirname+'/disconnect.js'
  };

  var tilereduce = TileReduce(bbox, opts);

  var geojson = turf.featurecollection([]);

  tilereduce.on('start', function(tiles){
    t.equal(tiles.length, 12)
    t.true(tiles.length > 0);
    tiles.forEach(function(tile) {
      t.equal(tile.length, 3);
    });
  });

  tilereduce.on('reduce', function(result, tile){
    geojson.features = geojson.features.concat(result.features);
  });

  tilereduce.on('end', function(){
    t.true(geojson.features.length > 0, 'trace had features');
    var allPoints = true;
    geojson.features.forEach(function(pt){
      if(!(pt.geometry.type === 'Point')){
        allPoints = false;
      }
    });
    t.true(allPoints, 'all trace features were points');

    fs.writeFileSync(__dirname+'/out.geojson', JSON.stringify(geojson));
    t.ok('tilereduce completed');

    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});
