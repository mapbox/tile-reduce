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

  var geojson = turf.featurecollection([]);

  tilereduce.on('start', function(tiles){
    t.pass('tilereduce started');
    t.equal(tiles.length, 49)
    t.equal(tiles[0].length, 3);
    t.equal(tiles[1].length, 3);
  });

  tilereduce.on('reduce', function(result, tile){
    geojson.features = geojson.features.concat(result.features);
  });

  tilereduce.on('end', function(error){
    t.true(geojson.features.length > 0, 'trace had features');
    t.true(geojson.features.length > 10000, 'at least 10k points');
    var allPoints = true;
    geojson.features.forEach(function(pt){
      if(!(pt.geometry.type === 'Point')){
        allPoints = false;
      }
    });
    t.true(allPoints, 'all trace features were points');

    fs.writeFileSync(__dirname+'/out.geojson', JSON.stringify(geojson));
    t.pass('tilereduce completed');

    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});