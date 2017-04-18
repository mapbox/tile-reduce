'use strict';

module.exports = function(data, tile, mapOptions, writeData, done) {
  var count = 0;
  if (data.osm.roads) count += data.osm.roads.length;
  if (data.osm.buildings) count += data.osm.buildings.length;
  if (data.tiger.tiger) count += data.tiger.tiger.length;
  done(null, count);
};
