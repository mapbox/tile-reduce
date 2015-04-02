# vt-mapreduce

mapreduce vector tile analysis processing

###index.js

```js
var mapreduce = new require('vt-mapreduce')();
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
        url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf,
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
  console.log('Processing '+tiles.length+' tiles');
});

mapreduce.on('reduce', function(result, tile){
  console.log(JSON.stringify(result));
});

mapreduce.on('error', function(error){
  console.log(error);
});

mapreduce.on('end', function(error){
  console.log('Complete');
});

var fc = mapreduce(bbox, opts);
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