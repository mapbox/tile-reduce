var test = require('tape');
var TileReduce = require('../../');
var diff = require('./diff.js');
var turf = require('turf');

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
        layers: ['road']
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
    t.true(tiles.length > 0);
    tiles.forEach(function(tile) {
      t.equal(tile.length, 3);
    });
  });

  tilereduce.on('reduce', function(result){
    if (result) geojson.features = geojson.features.concat(result);
  });

  tilereduce.on('end', function(error){
    t.true(geojson.features.length > 0, 'diff had features');
    var allPoly = geojson.features ? geojson.features.every(function(feature){
      return feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon';
    }) : false;
    t.true((allLines && geojson.features.length), 'all diff features were polygons');
    t.pass('tilereduce completed');
    t.end();
  });

  tilereduce.on('error', function(err){
    console.log(err);
    throw err;
  });

  tilereduce.run();
});
