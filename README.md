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

[See the count example processor's map script](https://github.com/mapbox/tile-reduce/blob/master/examples/count/count.js)

### reduce script

The reduce script serves both to initialize tile-reduce with job options, and to handle reducing results returned by the map script for each tile.

[See the count example processor's reduce script](https://github.com/mapbox/tile-reduce/blob/master/examples/count/index.js)


## options

### basic options

#### zoom

`zoom` specifies the zoom level of tiles to retrieve from each source.

```js
tilereduce({
	zoom: 15,
	// ...
})
```

#### map

Path to the map script, which will be executed against each tile

```js
tilereduce({
	map: path.join(__dirname, 'map.js')
	// ...
})
```

#### output

By default, any data written from workers is piped to `process.stdout` on the main process. You can pipe to an alternative writable stream using the `output` option.

```js
tilereduce({
	output: fs.createWriteStream('output-file'),
	// ...
})
```

#### log

Disables logging and progress output

```js
tilereduce({
	log: false,
	// ...
})
```

---
### specifying sources

sources are specified as an array in the `sources` option: 

```js
tilereduce({
	sources: [
		/* source objects */
	],
	// ...
})
```

#### MBTiles

```js
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

```js
sources: [
  {
    name: 'streets',
    url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
    layers: ['roads']
  }
]
```

---

### specifying job area

#### bbox

```js
tilereduce({
	bbox: [w, s, e, n],
	// ...
})
```

The bbox will be split into tiles by [tile-cover](https://github.com/mapbox/tile-cover).

#### geojson

```js
tilereduce({
	geojson: {"type": "Polygon", "coordinates": [/* coordinates */]},
	// ...
})
```

The polygon will be split into tiles by [tile-cover](https://github.com/mapbox/tile-cover).

#### tile array

```js
tilereduce({
	tiles: [
		[x, y, z]
	],
	// ...
})
```

#### tile stream

```js
tilereduce({
	tileStream: /* an object mode node stream */,
	// ...
})
```

Tiles can be read from an object mode [node stream](https://nodejs.org/api/stream.html). Each object in the stream should be either a string in the format `x y z` or an array in the format `[x, y, z]`. Line separated tile list files can easily be converted into the appropriate object mode streams using [binary-split](https://github.com/maxogden/binary-split):

```js
var split = require('binary-split'),
	fs = require('fs');
	
tilereduce({
	tileStream: fs.createReadStream('/path/to/tile-file').pipe(split()),
	// ...
})
```

Tile list files can be generated from mbtiles using [tippecanoe's](https://github.com/mapbox/tippecanoe) `tippecanoe-enumerate` utility

```sh
tippecanoe-enumerate /path/to/source.mbtiles | awk '{print $3, $4, $2} > tilelist'
```

## test

```sh
npm test
```
