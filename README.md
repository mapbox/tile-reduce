# tile-reduce

*Note: This module is under heavy development and is changing fast*

[MapReduce](http://en.wikipedia.org/wiki/MapReduce) geoprocessing across tiles

##install

```sh
npm install tile-reduce
```

##example

###run

```sh
node index.js | tippecanoe -o buffer.mbtiles
```

###index.js

```js
var TileReduce = new require('tile-reduce');

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
        layers: ['roads']
      }
    ],
  map: __dirname+'/buffer.js'
};

var tilereduce = TileReduce(bbox, opts);

tilereduce.on('reduce', function(result){
  console.log(JSON.stringify(result));
});

tilereduce.run();
```

###buffer.js

```js
var turf = require('turf');

module.exports = function (tileLayers, opts){
  var roads = tileLayers.streets.roads;
  return turf.buffer(roads, 20, 'meters');
}
```
