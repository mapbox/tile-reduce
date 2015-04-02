var test = require('tape')
var mapreduce = new require('vt-mapreduce')();
var diff = require('./diff.js');

test('diff', function(t){
  var bbox = [-77.05810546875,
      38.913475954379756,
      -77.04608917236328,
      38.92282516381189];

  var opts = {
    zoom: 15,
    tileLayers: [
        {
          name: 'streets',
          url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
          layers: ['roads', 'tunnel', 'bridge']
        },
        {
          name: 'tiger',
          url: 'https://a.tiles.mapbox.com/v4/tiger/{z}/{x}/{y}.vector.pbf',
          layers: ['routes']
        }
      ],
    map: diff
  };

  mapreduce.on('start', function(tiles){
    console.log('{"type":"FeatureCollection","features":[')
  });

  mapreduce.on('reduce', function(result, tile){
    console.log(JSON.stringify(result.features));
  });

  mapreduce.on('end', function(error){
    console.log(']}');
  });

  mapreduce.on('error', function(error){
    throw error;
  });

  mapreduce(bbox, opts);

  t.end()
})