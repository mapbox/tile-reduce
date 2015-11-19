# TileReduce

[![Build Status](https://travis-ci.org/mapbox/tile-reduce.svg)](https://travis-ci.org/mapbox/tile-reduce)

tile-reduce is a geoprocessing library that applies [MapReduce](http://en.wikipedia.org/wiki/MapReduce) to let you run large scale spatial analysis tile-by-tile.

## install

```sh
npm install tile-reduce
```

## usage

A tile-reduce processor is made of two parts; the map script and the reduce script. 

### map script

The map script operates on each individual tile. It's purpose is to receive one tile at a time, do analysis or processing on the tile, and write data and send results to the reduce script.

// TODO show a simple example

### reduce script

The reduce script serves both to initialize tile-reduce with job options, and to handle reducing results returned by the map script for each tile.

// TODO show a simple example

## options

### supported tile sources

sources are specified as an array in the `sources` option: 

```
sources: [
	/* source objects */
]
```

#### MBTiles

```
sources: [
  {
    name: 'osmdata',
    mbtiles: __dirname+'/latest.planet.mbtiles',
    layers: ['osm']
  }
]
```

Mbtiles are preferred for large scale analysis. Create your own mbtiles from vector data using [tippecanoe](https://github.com/mapbox/tippecanoe), or use [OSM QA Tiles](http://osmlab.github.io/osm-qa-tiles/) to analyze OpenStreetMap data.

#### URL

```
sources: [
  {
    name: 'streets',
    url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
    layers: ['roads']
  }
]
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

#### tile array

```
tiles: [
	[x, y, z],
	// ...
]
```

#### tile stream

```
tileStream: /* an object mode node stream */
```

Tiles can be read from an object mode [node stream](https://nodejs.org/api/stream.html). Each object in the stream should be either a string in the format `x y z` or an array in the format `[x, y, z]`. Line separated tile list files can easily be converted into the appropriate object mode streams using [binary-split](https://github.com/maxogden/binary-split):

```
var split = require('binary-split'),
	fs = require('fs');

var options = {
	tileStream: fs.createReadStream('/path/to/tile-file').pipe(split()),
	// ...
};
```

Tile list files can be generated from mbtiles using [tippecanoe's](https://github.com/mapbox/tippecanoe) `tippecanoe-enumerate` utility

```
tippecanoe-enumerate /path/to/source.mbtiles | awk '{print $3, $4, $2} > tilelist'
```

### output

By default, any data written from workers is piped to `process.stdout` on the main process. You can pipe to an alternative writable stream using the `output` option.

```
output: fs.createWriteStream('output-file'),
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
