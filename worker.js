var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');
var request = require('request');
var turf = require('turf');
var queue = require('queue-async');

module.exports = function(tiles, opts){
  tiles.forEach(function(tile){
    var q = queue(4);
    opts.tileLayers.forEach(function(tileLayer){
      q.defer(getVectorTile, {opts.zoom, tileLayer});
    });
    q.awaitAll(function(err, res){
      return opts.reduce(res);
    });
  });
}

function getVectorTile(tile, layer, url, done){
  var url = url.split('{x}').join(tile[0]);
  url = url.split('{y}').join(tile[1]);
  url = url.split('{z}').join(tile[2]);

  var requestOpts = {
    url: url,
    gzip: true,
    encoding: null
  };
  request(requestOpts, function(err, res, body) {
    try{
      var vt = new VectorTile(new Pbf(new Uint8Array(body)));
      if(vt.layers[layer]){
        var fc = turf.featurecollection([]);
        for(var i = 0; i < vt.layers[layer].length; i++){
          fc.features.push(vt.layers[layer].feature(i).toGeoJSON(t[0],t[1],t[2]));
        }
        done(null, fc);
      } else done(null, null);
    } catch(e){
      console.log(e);
      done(null, null);
    }
  })
}

function clip(fc, tile) {
  fc.features = fc.features.map(function(f){
      try{
        var clipped = turf.intersect(f, turf.polygon(tilebelt.tileToGeoJSON(tile).coordinates));
        return clipped;
      } catch(e){
        return;
      }
    })
    fc.features = fc.features.filter(function(trace){
      if(trace) return true;
    })
    return fc;
}