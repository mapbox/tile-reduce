var VectorTile = require('vector-tile').VectorTile;
var Pbf = require('pbf');
var request = require('request');
var turf = require('turf');
var queue = require('queue-async');

process.on('message', function(data) {
  data.tiles.forEach(function(tile){
    var layerCollection = {};
    var q = queue(1);
    data.opts.tileLayers.forEach(function(tileLayer){
      q.defer(getVectorTile, tile, tileLayer);
    });
    q.awaitAll(function(err, res){
      if(res){
        res.forEach(function(item){
          item.layers.forEach(function(layer){
            if(!layerCollection[item.name]) layerCollection[item.name] = {};
            layerCollection[item.name][layer] = item[layer];
          });
        });
        var message = require(data.opts.map)(layerCollection, tile);
        process.send(message);
      } else {
        process.send(0);
      }
    });
  });
});

function getVectorTile(tile, tileLayer, done){
  var layers = {
    name:tileLayer.name,
    layers:tileLayer.layers
  };

  var url = tileLayer.url.split('{x}').join(tile[0]);
  url = url.split('{y}').join(tile[1]);
  url = url.split('{z}').join(tile[2]);

  var requestOpts = {
    url: url,
    gzip: true,
    encoding: null
  };
  request(requestOpts, function(err, res, body) {
    var vt;
    try {
      vt = new VectorTile(new Pbf(new Uint8Array(body)));
    } catch(e){
      done(e, null);
    }
    tileLayer.layers.forEach(function(layer){
      layers[layer] = turf.featurecollection([]);
      if(vt && vt.layers[layer]){
        for(var i = 0; i < vt.layers[layer].length; i++){
          try {
            layers[layer].features.push(vt.layers[layer].feature(i).toGeoJSON(tile[0],tile[1],tile[2]));
          } catch(e){
            done(e, null);
          }
        }
      }
    });

    done(null, layers);
  });
}