module.exports = function(tileLayers, tile, done){
  if ((tileLayers.streets.head.statusCode == 200)) {
    done(null, tileLayers.streets.head.headers['content-length']);
  } else {
    done(null, 0);
  }
};