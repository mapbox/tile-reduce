# tile-reduce

[![Build Status](https://travis-ci.org/mapbox/tile-reduce.svg)](https://travis-ci.org/mapbox/tile-reduce)

tile-reduce is a geoprocessing library that applies [MapReduce](http://en.wikipedia.org/wiki/MapReduce) to let you run large scale spatial analysis tile-by-tile.

## install

```sh
npm install tile-reduce
```

## usage

A tile-reduce processor is made of two parts; the map script and the reduce script. 

### map script

// TODO describe map script

### reduce script

// TODO describe the reduce script


## options

### supported tile sources

#### MBTiles

```
{
  name: 'osmdata',
  mbtiles: __dirname+'/latest.planet.mbtiles',
  layers: ['osm']
}
```

Mbtiles are preferred for large scale analysis. Create your own mbtiles from vector data using [tippecanoe](https://github.com/mapbox/tippecanoe), or use [OSM QA Tiles](http://osmlab.github.io/osm-qa-tiles/) to analyze OpenStreetMap data.

#### URL

```
{
  name: 'streets',
  url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
  layers: ['roads']
}
```

### specifying job area

#### bbox

```
bbox: [w, s, e, n]
```

The bbox will be split into tiles by [tile-cover](https://github.com/mapbox/tile-cover).

#### geojson

```
geojson: {"type": "Polygon", "coordinates": [/* coordinates */]}
```

The polygon will be split into tiles by [tile-cover](https://github.com/mapbox/tile-cover).

#### tiles - array

```
tiles: [
	[x, y, z],
	// ...
]
```

#### tiles - file stream

```
tiles: '/path/to/tilelist'
```

streams a file of line separated `x y z` tile coordinates. The file should be formatted like so: 

```
100 200 12
100 201 12
```

Tile list files can be generated from mbtiles using [tippecanoe's](https://github.com/mapbox/tippecanoe) `tippecanoe-enumerate` utility

```
tippecanoe-enumerate /path/to/source.mbtiles | awk '{print $3, $4, $2} > tilelist'
```


## example

// TODO maybe cut out the example here and just provide a list of linked examples (link to our examples folders here, osm-sidewalker, other processors)

This example takes a selection of OpenStreetMap roads from Mapbox Streets, buffers them, and pipes the output to tippecanoe.

### run

```sh
node index.js | tippecanoe -o buffer.mbtiles
```

### index.js

```js
var tilereduce = new require('tile-reduce');

var opts = {
  zoom: 15,
  bbox: [
    -80.13702392578125,
    32.72721987021932,
    -79.75799560546875,
    32.936081249036604
  ],
  sources: [
      {
        name: 'streets',
        url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
        layers: ['road']
      }
    ],
  map: __dirname+'/buffer.js'
};

var tilereduce(opts);
.on('reduce', function(result){
  console.log(JSON.stringify(result));
});

tilereduce.run();
```

### buffer.js

```js
var turf = require('turf');

module.exports = function (sources, opts, write, done){
  var road = sources.streets.road;
  var bufferedRoad = turf.buffer(road, 20, 'meters');
  done(null, bufferedRoad);
}
```

## test

```sh
npm test
```
