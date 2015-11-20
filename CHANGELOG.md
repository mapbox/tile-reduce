CHANGELOG
---

##3.0.0

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