# tile-reduce

*Note: This module is under heavy development and is changing fast*

[MapReduce](http://en.wikipedia.org/wiki/MapReduce) geoprocessing across tiles

##example

###run

```sh
node index.js | tippecanoe -o diff.mbtiles
```

###index.js

```js
var tilereduce = new require('tile-reduce')();
var diff = require('diff');

var bbox = [
    -80.13702392578125,
    32.72721987021932,
    -79.75799560546875,
    32.936081249036604
  ];

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

tilereduce.on('start', function(tiles){
  console.log('{"type":"FeatureCollection","features":[')
});

tilereduce.on('reduce', function(result, tile){
  console.log(JSON.stringify(result.features));
});

tilereduce.on('end', function(error){
  console.log(']}');
});

tilereduce.on('error', function(error){
  throw error;
});

tilereduce(bbox, opts);
```

###diff.js

```js
var turf = require('turf');

module.exports = function createDiff(tileLayers, opts){
  var roads = tileLayers.streets.roads;
  roads.features = roads.features.map(function(road){
    return turf.buffer(road, 50, 'feet');
  });
  var routes = tileLayers.tiger.routes;
  routes = turf.erase(roads, routes);
  return routes;
}
```
