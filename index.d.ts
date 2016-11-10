/// <reference types="node" />

interface Events {
  /***
   * https://github.com/mapbox/tile-reduce#start
   */
  on(type: 'start', callback: () => void): Events;

  /***
   * https://github.com/mapbox/tile-reduce#map
   */
  on(type: 'map', callback: (tile: TileReduce.Tile, workerId: number) => void): Events;

  /***
   * https://github.com/mapbox/tile-reduce#reduce
   */
  on(type: 'reduce', callback: (result: any, tile: TileReduce.Tile) => void): Events;

  /***
   * https://github.com/mapbox/tile-reduce#end
   */
  on(type: 'end', callback: (error: any) => void): Events;
}

/***
 * https://github.com/mapbox/tile-reduce#options
 */
interface Options {
  map: string;
  zoom: number;
  sources: Array<TileReduce.Source>;
  bbox?: TileReduce.BBox;
  geojson?: any;
  log?: boolean;
  mapOptions?: any;
  maxWorkers?: number;
  output?: any;
  tiles?: Array<TileReduce.Tile>;
  tileStream?: any;
  sourceCover?: string;
}

/***
 * https://github.com/mapbox/tile-reduce#options
 */
declare function TileReduce (options: Options): Events;

declare namespace TileReduce {
  /**
   * BBox [west, south, east, north]
   */
  type BBox = [number, number, number, number];
  /**
   * Tile [x, y, z]
   */
  type Tile = [number, number, number];
  /**
   * Event Types
   */
  type Types = "start" | "map" | "reduce" | "end";

  /***
   * https://github.com/mapbox/tile-reduce#specifying-sources-required
   */
  interface Source {
    name: string;
    mbtiles?: string;
    url?: string;
    layers?: Array<string>;
    maxrate?: number;
    raw?: boolean;
  }
}

/***
 * https://github.com/mapbox/tile-reduce#mapoptions
 */
declare namespace NodeJS  {
  interface Global {
    mapOptions: any
  }
}

/***
 * https://github.com/mapbox/tile-reduce
 */
declare module "tile-reduce" {
  export = TileReduce
}
