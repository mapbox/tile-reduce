# TileReduce

[![Build Status](https://travis-ci.org/mapbox/tile-reduce.svg)](https://travis-ci.org/mapbox/tile-reduce)

TileReduce is a geoprocessing library that implements [MapReduce](http://en.wikipedia.org/wiki/MapReduce) to let you run scalable distributed spatial analysis using [Javascript](http://nodejs.org/) and [Mapbox Vector Tiles](https://www.mapbox.com/developers/vector-tiles/). TileReduce coordinates tasks across all available processors on a machine, so your analysis runs lightning fast with minimal optimization.

## Install

```sh
npm install tile-reduce
```

## Usage

A TileReduce processor is composed of two parts; the "map" script and the "reduce" script. The "map" portion comprises the expensive processing you want to distribute, while the "reduce" script comprises the quick aggregation step.

### 'map' script

The map script operates on each individual tile. It's purpose is to receive one tile at a time, do analysis or processing on the tile, and write data and send results to the reduce script.

[See the count example processor's map script](https://github.com/mapbox/tile-reduce/blob/master/examples/count/count.js)

### 'reduce' script

The reduce script serves both to initialize TileReduce with job options, and to handle reducing results returned by the map script for each tile.

[See the count example processor's reduce script](https://github.com/mapbox/tile-reduce/blob/master/examples/count/index.js)


## Options

### Basic Options

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
### Specifying Sources

Sources are specified as an array in the `sources` option:

```js
tilereduce({
	sources: [
		/* source objects */
	],
	// ...
})
```

#### mbtiles

```js
sources: [
  {
    name: 'osmdata',
    mbtiles: __dirname+'/latest.planet.mbtiles',
    layers: ['osm']
  }
]
```

[Mbtiles](https://github.com/mapbox/mbtiles-spec) work well for optimizing tasks that request many tiles, since the data is stored on disk. Create your own mbtiles from vector data using [tippecanoe](https://github.com/mapbox/tippecanoe), or use [OSM QA Tiles](http://osmlab.github.io/osm-qa-tiles/), a continuously updated mbtiles representation of OpenStreetMap.

#### URL

Remote Vector Tile sources accessible over HTTP work well for mashups of datasets and datasets that would not be practical to fit on a single machine. Be aware that HTTP requests are slower than mbtiles, and throttling is typically required to avoid disrupting servers at high tile volumes. `maxrate` dictates how many requests per second will be made to each remote source.

```js
sources: [
  {
    name: 'streets',
    url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
    layers: ['roads'],
    maxrate: 10
  }
]
```

---

### Specifying Job Area

Jobs run over a geographic region represented by a set of tiles. TileReduce also accepts several area definitions that will be automatically converted into tiles.

#### BBOX

A valid [bounding box](http://geojson.org/geojson-spec.html#bounding-boxes) array.

```js
tilereduce({
	bbox: [w, s, e, n],
	// ...
})
```

#### GeoJSON

A valid [GeoJSON geometry](http://geojson.org/geojson-spec.html#geojson-objects) of any type.

```js
tilereduce({
	geojson: {"type": "Polygon", "coordinates": [/* coordinates */]},
	// ...
})
```

#### Tile Array

An array of [quadtiles](https://msdn.microsoft.com/en-us/library/bb259689.aspx) represented as xyz arrays.

```js
tilereduce({
	tiles: [
		[x, y, z]
	],
	// ...
})
```

#### Tile Stream

Tiles can be read from an object mode [node stream](https://nodejs.org/api/stream.html). Each object in the stream should be either a string in the format `x y z` or an array in the format `[x, y, z]`.

```js
tilereduce({
	tileStream: /* an object mode node stream */,
	// ...
})
```

Line separated tile list files can easily be converted into the appropriate object mode streams using [binary-split](https://github.com/maxogden/binary-split):

```js
var split = require('binary-split'),
	fs = require('fs');

tilereduce({
	tileStream: fs.createReadStream('/path/to/tile-file').pipe(split()),
	// ...
})
```

#### Text File

Tile list files can be conveniently generated from mbtiles using [tippecanoe](https://github.com/mapbox/tippecanoe)'s' `tippecanoe-enumerate` utility.

```sh
tippecanoe-enumerate /path/to/source.mbtiles | awk '{print $3, $4, $2} > tilelist'
```

## Testing

```sh
npm test
```

## Linting

```sh
npm run lint
```

## Test Coverage

```sh
npm run cover
```
