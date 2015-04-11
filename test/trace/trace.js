var turf = require('turf');
var cover = require('tile-cover');
var tilebelt = require('tilebelt');
var normalize = require('geojson-normalize');
var flatten = require('geojson-flatten');

module.exports = function trace(tileLayers, tile){
  var pixelZoom = 22;
  var minRuns = 5;
  var runkeeper = normalize(flatten(tileLayers.runkeeper.runkeeper));
  var streets = normalize(flatten(tileLayers.streets.road));
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.bridge)).features);
  streets.features = streets.features.concat(normalize(flatten(tileLayers.streets.tunnel)).features);
  var coverOpts = {min_zoom: pixelZoom, max_zoom: pixelZoom};

  streets = clip(streets, tile);
  runkeeper = clip(runkeeper, tile);
  streets = normalize(flatten(streets));
  runkeeper = normalize(flatten(runkeeper));
  streets = cleanLines(streets);
  runkeeper = cleanLines(runkeeper);

  var streetsBuff = turf.featurecollection([]);
  streets.features.forEach(function(street){
    streetsBuff.features = streetsBuff.features.concat(turf.buffer(street, 0.0189394, 'miles').features);
  });
  streetsBuff = normalize(flatten(streetsBuff));

  var streetPixels = {};
  streetsBuff.features.forEach(function(street){
    var tiles = cover.tiles(street.geometry, coverOpts);
    for(var i = 0; i < tiles.length; i++){
      streetPixels[tiles[i][0]+'/'+tiles[i][1]+'/'+tiles[i][2]] = true;
    }
  });

  var runkeeperPixels = {};
  runkeeper.features.forEach(function(run){
    var tiles = cover.tiles(run.geometry, coverOpts);
    for(var i = 0; i < tiles.length; i++){
      if(!streetPixels[tiles[i][0]+'/'+tiles[i][1]+'/'+tiles[i][2]]){
        if(!runkeeperPixels[tiles[i][0]+'/'+tiles[i][1]+'/'+tiles[i][2]]){
          runkeeperPixels[tiles[i][0]+'/'+tiles[i][1]+'/'+tiles[i][2]] = 1;
        } else {
          runkeeperPixels[tiles[i][0]+'/'+tiles[i][1]+'/'+tiles[i][2]]++;
        }
      }
    }
  });

  var diffFc = turf.featurecollection([]);
  diffFc.features = Object.keys(runkeeperPixels).map(function(hash){
    var tile = hash.split('/').map(parseFloat);
    var poly = turf.centroid(turf.polygon(tilebelt.tileToGeoJSON(tile).coordinates));
    poly.properties.count = runkeeperPixels[hash];
    return poly;
  });
  diffFc.features = diffFc.features.filter(function(cell){
    if(cell.properties.count > minRuns) return true;
  });

  return {
    missing: diffFc,
    runkeeper: runkeeper,
    streets: streets,
    streetsBuff: streetsBuff
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
    return lines;
}

function cleanLines (lines) {
  lines.features.filter(function(line){
    if(line.geometry.type === 'LineString' || line.geometry.type === 'MultiLineString') return true;
  });
  return lines;
}