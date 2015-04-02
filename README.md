# vt-mapreduce

mapreduce vector tile processing

###index.jss

```js
var mapreduce = require('vt-mapreduce');
var diff = require('diff');

var bbox = [
    -80.13702392578125,
    32.72721987021932,
    -79.75799560546875,
    32.936081249036604
  ]

var opts = {
  zoom: 15,
  tileLayers: [
      {
        name: 'streets',
        url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf,
        layers: ['roads', 'tunnel', 'bridge']
      },
      {
        name: 'traces',
        url: 'https://a.tiles.mapbox.com/v4/enf.8t2tvs4i/{z}/{x}/{y}.vector.pbf,
        layers: ['routes']
      }
    ],
  process: diff
};

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
  var routes = tileLayers.traces.routes;
  routes = turf.erase(roads, routes);
  return routes;
}
```