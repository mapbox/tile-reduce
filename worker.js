var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');
var request = require('request');
var turf = require('turf');
var queue = require('queue-async');

process.on('message', function(data) {
  data.tiles.forEach(function(tile){
    var layerCollection = {};
    var q = queue(4);
    data.opts.tileLayers.forEach(function(tileLayer){
      q.defer(getVectorTile, tile, tileLayer)
    });
    q.awaitAll(function(err, res){
      res.forEach(function(item){
        item.layers.forEach(function(layer){
          if(!layerCollection[item.name]) layerCollection[item.name] = {};
          layerCollection[item.name][layer] = item[layer]
        });
      });

      process.send(require(data.opts.map)(layerCollection));
    });
  });
});

function getVectorTile(tile, tileLayer, done){
  var url = tileLayer.url.split('{x}').join(tile[0]);
  url = url.split('{y}').join(tile[1]);
  url = url.split('{z}').join(tile[2]);

  var requestOpts = {
    url: url,
    gzip: true,
    encoding: null
  };
  request(requestOpts, function(err, res, body) {
    try {
      var vt = new VectorTile(new Pbf(new Uint8Array(body)));
      tileLayer.layers.forEach(function(layer){
        var fc = turf.featurecollection([]);
        for(var i = 0; i < vt.layers[layer].length; i++){
          fc.features.push(vt.layers[layer].feature(i).toGeoJSON(tile[0],tile[1],tile[2]));
        }
        tileLayer[layer] = fc;
      })
      done(null, tileLayer);
    } catch(e){
      done(e, null);
    }
  })
}