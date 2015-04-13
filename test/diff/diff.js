var turf = require('turf'),
  flatten = require('geojson-flatten'),
  normalize = require('geojson-normalize'),
  tilebelt = require('tilebelt');

module.exports = function(tileLayers, tile) {
  // concat feature classes and normalize data
  var tigerRoads = normalize(tileLayers.tiger.tiger20062014);
  var streets = normalize(tileLayers.streets.road);
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.bridge)).features);
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.tunnel)).features);

  // clip features to tile
  streets = clip(streets, tile);
  tigerRoads = clip(tigerRoads, tile);
  streets = normalize(flatten(streets));
  tigerRoads = normalize(flatten(tigerRoads));

  // buffer streets
  var streetBuffers = turf.featurecollection([]);
  streetBuffers.features = streets.features.map(function(road){
    return turf.buffer(road, 5, 'meters').features[0];
  });
  streetBuffers = normalize(turf.merge(streetBuffers));

  // erase street buffer from tiger lines
  var tigerDeltas = turf.featurecollection([]);
  tigerRoads.features.forEach(function(tigerRoad){
    streetBuffers.features.forEach(function(streetsRoad){
      var roadDiff = turf.erase(tigerRoad, streetsRoad);
      if(roadDiff) tigerDeltas.features.push(roadDiff);
    });
  });
  tigerDeltas = normalize(flatten(tigerDeltas));

  return {
    diff: tigerDeltas,
    tiger: tigerRoads,
    streets: streets
  };
};

function clip(lines, tile) {
  lines.features = lines.features.map(function(line){
    try {
      var clipped = turf.intersect(line, turf.polygon(tilebelt.tileToGeoJSON(tile).coordinates));
      return clipped;
    } catch(e){
      return;
    }
  });
  lines.features = lines.features.filter(function(line){
    if(line) return true;
  });
  lines.features = lines.features.filter(function(line){
    if(line.geometry.type === 'LineString' || line.geometry.type === 'MultiLineString') return true;
  });
  return lines;
}