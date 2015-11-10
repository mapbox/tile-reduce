'use strict';

module.exports = function(data, tile, done) {
  var count = 0;
  if(data.osm.roads) count += data.osm.roads.length;
  if(data.osm.buildings) count += data.osm.buildings.length;
  done(null, count);
};
