# Changelog

## 3.1.1

- fix a big memory leak that happened when writing a big amount of JSON data out

## 3.1.0

- add `mapOptions` option that passes global options to workers

## 3.0.2

- add `maxWorkers` option
- fix sporadical failures on big MBTiles files
- fix MBTiles support on Windows

## 3.0.0

- move Vector Tile parsing to workers (major performance improvements)
- overhaul tests around new architecture (high test coverage)
- per-source remote throttling
- rework job and source API (see docs for details)
- allow streaming tiles in job definitions
- support `tippecanoe enumerate` txt file tile parameters
- add `writeData` callback to 'map' script API for efficiently writing append-only results
- support pulling tile parameter directly from an mbtiles source
- add progress bar and detailed logging
- add option for disabled logging
- improved API documentation
