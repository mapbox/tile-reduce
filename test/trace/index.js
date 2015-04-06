var test = require('tape');
var TileReduce = require('../../');
var diff = require('./trace.js');
var turf = require('turf');
var fs = require('fs');

test('diff', function(t){
  var bbox = [
    -79.82786178588867,
    32.85147083076529,
    -79.76743698120117,
    32.899047110321014
    ];

  var opts = {
    zoom: 15,
    tileLayers: [
        {
          name: 'streets',
          url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
          layers: ['road', 'bridge', 'tunnel']
        },
        {
          name: 'runkeeper',
          url: 'https://a.tiles.mapbox.com/v4/enf.8t2tvs4i/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
          layers: ['runkeeper']
        }
      ],
    map: __dirname+'/trace.js'
  };

  var tilereduce = TileReduce(bbox, opts);

  var layers = {
    runkeeper: turf.featurecollection([]),
    streets: turf.featurecollection([]),
    streetsBuff: turf.featurecollection([]),
    missing: turf.featurecollection([]),
  };

  var tilesToProcess;
  var tilesProcessed = 0;
  tilereduce.on('start', function(tiles){
    t.pass('tilereduce started');
    t.equal(tiles.length, 49);
    t.equal(tiles[0].length, 3);
    t.equal(tiles[1].length, 3);
    tilesToProcess = tiles.length;
  });

  tilereduce.on('reduce', function(result, tile){
    tilesProcessed++;
    layers.missing.features = layers.missing.features.concat(result.missing.features);
    layers.runkeeper.features = layers.runkeeper.features.concat(result.runkeeper.features);
    layers.streets.features = layers.streets.features.concat(result.streets.features);
    layers.streetsBuff.features = layers.streetsBuff.features.concat(result.streetsBuff.features);
  });

  tilereduce.on('end', function(error){
    t.true(layers.missing.features.length > 0, 'trace had features');
    t.true(layers.missing.features.length > 100, 'at least 100 points');
    var allPoints = true;
    layers.missing.features.forEach(function(pt){
      if(!(pt.geometry.type === 'Point')){
        allPoints = false;
      }
    });
    t.true(allPoints, 'all trace features were points');

    t.equal(tilesToProcess, tilesProcessed, 'processed all tile');
    
    fs.writeFileSync(__dirname+'/missing.geojson', JSON.stringify(layers.missing));
    fs.writeFileSync(__dirname+'/runkeeper.geojson', JSON.stringify(layers.runkeeper));
    fs.writeFileSync(__dirname+'/streets.geojson', JSON.stringify(layers.streets));
    fs.writeFileSync(__dirname+'/streets-buff.geojson', JSON.stringify(layers.streetsBuff));
    t.pass('tilereduce completed');

    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});