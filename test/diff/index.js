var test = require('tape');
var TileReduce = require('../../');
var diff = require('./diff.js');
var turf = require('turf');
var fs = require('fs');

test('diff', function(t){
  var bbox = [
    -77.05810546875,
    38.913475954379756,
    -77.04608917236328,
    38.92282516381189
  ];

  var opts = {
    zoom: 15,
    tileLayers: [
      {
        name: 'streets',
        url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
        layers: ['road', 'tunnel', 'bridge']
      },
      {
        name: 'tiger',
        url: 'https://b.tiles.mapbox.com/v4/enf.rirltyb9/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
        layers: ['tiger20062014']
      }
    ],
    map: __dirname + '/diff.js'
  };

  var tilereduce = TileReduce(bbox, opts);
  var geojson = turf.featurecollection([]);

  tilereduce.on('start', function(tiles){
    t.equal(tiles.length, 4, '4 tiles covered');
    tiles.forEach(function(tile) {
      t.equal(tile.length, 3, 'valid tile');
    });
  });

  tilereduce.on('reduce', function(result){
    if (result) geojson.features = geojson.features.concat(result.features);
  });

  tilereduce.on('end', function(error){
    t.true(geojson.features.length > 0, 'diff had features');
    var allLines = true;
    geojson.features.forEach(function(feature){
      if(!(feature.geometry.type === 'LineString')){
        allLines = false;
      }
    });
    t.true(allLines, 'all trace features were polygons');
    fs.writeFileSync(__dirname+'/out.geojson', JSON.stringify(geojson));
    t.pass('tilereduce completed');
    t.end();
  });

  tilereduce.on('error', function(err){
    throw err;
  });

  tilereduce.run();
});
