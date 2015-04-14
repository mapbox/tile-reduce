var test = require('tape');
var TileReduce = require('../../');
var diff = require('./diff.js');
var turf = require('turf');
var fs = require('fs');

test('diff', function(t){
  var bbox = [
     -77.06866264343262,
    38.92062153254231,
    -77.02746391296387,
    38.9499309049864
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
  var layers = {
    diff: turf.featurecollection([]),
    tiger: turf.featurecollection([]),
    streets: turf.featurecollection([])
  };

  tilereduce.on('start', function(tiles){
    t.equal(tiles.length, 16, '4 tiles covered');
    tiles.forEach(function(tile) {
      t.equal(tile.length, 3, 'valid tile [' + tile + ']');
    });
  });

  tilereduce.on('reduce', function(result){
    layers.diff.features = layers.diff.features.concat(result.diff.features);
    layers.tiger.features = layers.tiger.features.concat(result.tiger.features);
    layers.streets.features = layers.streets.features.concat(result.streets.features);
  });

  tilereduce.on('end', function(error){
    t.true(layers.diff.features.length > 0, 'diff had features');
    var allLines = layers.diff.features.every(function(feature){
      return feature.geometry.type === 'LineString';
    });
    t.true(allLines, 'all trace features were lines');
    fs.writeFileSync(__dirname+'/out/diff.geojson', JSON.stringify(layers.diff));
    fs.writeFileSync(__dirname+'/out/tiger.geojson', JSON.stringify(layers.tiger));
    fs.writeFileSync(__dirname+'/out/streets.geojson', JSON.stringify(layers.streets));
    t.pass('tilereduce completed');
    t.end();
  });

  tilereduce.on('error', function(err){
    throw err;
  });

  tilereduce.run();
});
