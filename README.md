# TileReduce

[![Build Status](https://travis-ci.org/mapbox/tile-reduce.svg)](https://travis-ci.org/mapbox/tile-reduce)

TileReduce is a geoprocessing library that implements [MapReduce](http://en.wikipedia.org/wiki/MapReduce) to let you run scalable distributed spatial analysis using [JavaScript](http://nodejs.org/) and [Mapbox Vector Tiles](https://www.mapbox.com/developers/vector-tiles/). TileReduce coordinates tasks across all available processors on a machine, so your analysis runs lightning fast.

## Install

```sh
npm install @mapbox/tile-reduce
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

#### zoom (required)

`zoom` specifies the zoom level of tiles to retrieve from each source.

```js
tilereduce({
	zoom: 15,
	// ...
})
```

#### map (required)

Path to the map script, which will be executed against each tile

```js
tilereduce({
	map: path.join(__dirname, 'map.js')
	// ...
})
```
#### maxWorkers

By default, TileReduce creates one worker process per CPU. `maxWorkers` may be used to limit the number of workers created

```js
tilereduce({
  maxWorkers: 3,
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

#### mapOptions

Passes through arbitrary options to workers. Options are made available to map scripts as `global.mapOptions`

```js
tilereduce({
	mapOptions: {
		bufferSize: 4
	}
	// ...
})
```

```js
// map.js
module.exports = function (sources, tile, write, done) {
  global.mapOptions.bufferSize; // = 4
};
```

### Specifying Sources (required)

Sources are specified as an array in the `sources` option:

```js
tilereduce({
	sources: [
		/* source objects */
	],
	// ...
})
```

#### MBTiles sources:

```js
tilereduce({
    sources: [
      {
        name: 'osmdata',
        mbtiles: __dirname+'/latest.planet.mbtiles',
        layers: ['osm']
      }
    ]
})
```

[MBTiles](https://github.com/mapbox/mbtiles-spec) work well for optimizing tasks that request many tiles, since the data is stored on disk. Create your own MBTiles from vector data using [tippecanoe](https://github.com/mapbox/tippecanoe), or use [OSM QA Tiles](http://osmlab.github.io/osm-qa-tiles/), a continuously updated MBTiles representation of OpenStreetMap.

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

#### raw

By default, sources will be automatically converted from their raw Vector Tile representation to GeoJSON. If you set `raw: true` in an MBTiles or URL source, the [raw Vector Tile data](https://github.com/mapbox/vector-tile-js) will be provided, allowing you to lazily parse features as needed. This is useful in some situations for maximizing performance.

```js
sources: [
  {
    name: 'streets',
    url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
    raw: true
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

#### Source Cover

When using MBTiles sources, a list of tiles to process can be automatically retrieved from the source metadata

```js
tilereduce({
	sourceCover: 'osmdata',
	sources: [
		{
			name: 'osmdata',
			mbtiles: __dirname+'/latest.planet.mbtiles'
		}
	]
	// ...
})
```

## Events

TileReduce returns an [EventEmitter]().

### start

Fired once all workers are initialized and before the first tiles are sent for processing

```js
tilereduce({/* ... */})
.on('start', function () {
	console.log('starting');
});
```

### map 

Fired just before a tile is sent to a worker. Receives the tile and worker number assigned to process the tile.

```js
tilereduce({/* ... */})
.on('map', function (tile, workerId) {
	console.log('about to process ' + JSON.stringify(tile) +' on worker '+workerId);
});
```

### reduce 

Fired when a tile has finished processing. Receives data returned in the map function's `done` callback (if any), and the tile.

```js
var count = 0;
tilereduce({/* ... */})
.on('reduce', function (result, tile) { 
	console.log('got a count of ' + result + ' from ' + JSON.stringify(tile));
	count++;
});
```

### end

Fired when all queued tiles have been processed. Use this event to output final reduce results.

```js
var count = 0;
tilereduce({/* ... */})
.on('end', function () {
	console.log('Total count was: ' + count);
});
```

## Processor Examples

- [osm-coverage](https://github.com/mapbox/osm-coverage) - a processor for computing statistics about [OpenStreetMap](http://www.openstreetmap.org/) coverage across countries.

- [osm-sidewalker](https://github.com/mapbox/osm-sidewalker) - a processor for detecting potentially untagged sidewalks in [OpenStreetMap](http://www.openstreetmap.org/).

## Development

### Testing

```sh
npm test
```

### Linting

```sh
npm run lint
```

### Test Coverage

```sh
npm run cover
```
