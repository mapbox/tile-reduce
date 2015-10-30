'use strict';

module.exports = function(data, tile, done) {
  done(null, data.osm.osm.length);
};
