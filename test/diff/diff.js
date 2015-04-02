var turf = require('turf');

module.exports = function createDiff(tileLayers, opts){
  var roads = tileLayers.streets.roads;
  roads.features = roads.features.map(function(road){
    return turf.buffer(road, 50, 'feet');
  });
  var routes = tileLayers.tiger.routes;
  routes = turf.erase(roads, routes);
  return routes;
}