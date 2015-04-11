var test = require('tape');
var TileReduce = require('../../');
var diff = require('./trace.js');
var turf = require('turf');
var fs = require('fs');
var tilebelt = require('tilebelt');
var turf = require('turf');

test('trace', function(t){
  var bbox = [
    -79.88468170166014,
    32.807764678901414,
    -79.7823715209961,
    32.90524456313979
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
    tiles: turf.featurecollection([])
  };

  var tilesToProcess;
  var tilesProcessed = 0;
  tilereduce.on('start', function(tiles){
    t.pass('tilereduce started');
    t.equal(tiles.length, 121);
    t.equal(tiles[0].length, 3);
    t.equal(tiles[1].length, 3);
    tilesToProcess = tiles.length;

    tiles.forEach(function(tile){
      layers.tiles.features.push(turf.polygon(tilebelt.tileToGeoJSON(tile).coordinates));
    });
  });

  tilereduce.on('reduce', function(result){
    tilesProcessed++;
    layers.missing.features = layers.missing.features.concat(result.missing.features);
    layers.runkeeper.features = layers.runkeeper.features.concat(result.runkeeper.features);
    layers.streets.features = layers.streets.features.concat(result.streets.features);
    layers.streetsBuff.features = layers.streetsBuff.features.concat(result.streetsBuff.features);
  });

  tilereduce.on('end', function(error){
    t.true(layers.missing.features.length > 0, 'trace had features');
    t.equal(layers.missing.features.length, 83);
    var allPoints = true;
    layers.missing.features.forEach(function(pt){
      if(!(pt.geometry.type === 'Point')){
        allPoints = false;
      }
    });
    t.true(allPoints, 'all trace features were points');

    t.equal(tilesToProcess, tilesProcessed, 'processed all tile');
    
    fs.writeFileSync(__dirname+'/out/missing.geojson', JSON.stringify(layers.missing));
    fs.writeFileSync(__dirname+'/out/runkeeper.geojson', JSON.stringify(layers.runkeeper));
    fs.writeFileSync(__dirname+'/out/streets.geojson', JSON.stringify(layers.streets));
    fs.writeFileSync(__dirname+'/out/streets-buff.geojson', JSON.stringify(layers.streetsBuff));
    fs.writeFileSync(__dirname+'/out/tiles.geojson', JSON.stringify(layers.tiles));
    t.pass('tilereduce completed');

    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});