var test = require('tape');
var turf = require('turf');
var tilebelt = require('tilebelt');
var computeCover = require('../').computeCover;
var isValidTile = require('../').isValidTile;
var tilesToZoom = require('../').tilesToZoom;

test('computeCover', function(t){
  var zoom = 15;

  // tile
  var exactTile = computeCover([9372,12536,15], zoom);
  t.equal(exactTile.length, 1);
  t.equal(exactTile.toString(), [9372,12536,15].toString());
  var lowTiles = computeCover([4686,6268,14], zoom);
  t.equal(lowTiles.length, 4, 'should have 4 children tiles');
  t.true(tilebelt.hasTile(lowTiles, [ 9372, 12536, 15 ]), 'lowTiles has child');
  t.true(tilebelt.hasTile(lowTiles, [ 9373, 12536, 15 ]), 'lowTiles has child');
  t.true(tilebelt.hasTile(lowTiles, [ 9373, 12537, 15 ]), 'lowTiles has child');
  t.true(tilebelt.hasTile(lowTiles, [ 9372, 12537, 15 ]), 'lowTiles has child');

  var extraLowTiles = computeCover([2343,3134,13], zoom);
  t.equal(extraLowTiles.length, 16, 'should have 4 children tiles');
  t.true(tilebelt.hasTile(extraLowTiles, [ 9372, 12536, 15 ]), 'extraLowTiles has child');
  t.true(tilebelt.hasTile(extraLowTiles, [ 9373, 12536, 15 ]), 'extraLowTiles has child');
  t.true(tilebelt.hasTile(extraLowTiles, [ 9373, 12537, 15 ]), 'extraLowTiles has child');
  t.true(tilebelt.hasTile(extraLowTiles, [ 9372, 12537, 15 ]), 'extraLowTiles has child');
  // tiles

  // bbox
  var bbox = [-77.117,38.850,-76.975,38.968];
  var bboxTiles = computeCover(bbox, zoom);
  t.equal(bboxTiles.length, 210, 'bbox contains 210 z15 tiles');
  t.true(isValidTile(bboxTiles[0]), 'valid tile');
  t.true(isValidTile(bboxTiles[1]), 'valid tile');
  t.true(isValidTile(bboxTiles[2]), 'valid tile');
  t.true(isValidTile(bboxTiles[bboxTiles.length-1]), 'valid tile');

  // GeoJSON polygon
  var polygon = {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            -77.11715698242186,
            38.85040342169187
          ],
          [
            -77.11715698242186,
            38.96848501741372
          ],
          [
            -76.97502136230469,
            38.96848501741372
          ],
          [
            -76.97502136230469,
            38.85040342169187
          ],
          [
            -77.11715698242186,
            38.85040342169187
          ]
        ]
      ]
    }
  };
  var polyTiles = computeCover(polygon, zoom);
  t.equal(polyTiles.length, 210, 'polygon contains 210 z15 tiles');
  t.true(isValidTile(polyTiles[0]), 'valid tile');
  t.true(isValidTile(polyTiles[1]), 'valid tile');
  t.true(isValidTile(polyTiles[2]), 'valid tile');
  t.true(isValidTile(bboxTiles[polyTiles.length-1]), 'valid tile');

  try {
    computeCover(turf.featurecollection([]), zoom);
  } catch(err){
    t.equal(err.toString(), 'Error: Unrecognized cover type', 'throw error with bad cover');
  }

  t.end();
});

test('isValidTile', function(t){
  t.true(isValidTile([0,0,0]), 'valid tile');
  t.true(isValidTile([2,2,3]), 'valid tile');
  t.false(isValidTile([0,0,0,1]), 'no length 4 tiles');
  t.false(isValidTile([1,1]), 'no length 2 tiles');
  t.false(isValidTile(['1','1','1']), 'no strings');

  t.end();
});

test('tilesToZoom', function(t){
  var zoomUp1 = tilesToZoom([[0,0,0]],1);
  t.equal(zoomUp1.length, 4);
  var zoomUp1HasTiles = true;
  [[0,0,1],[1,0,1],[0,1,1],[1,1,1]].forEach(function(tile){
    if(!tilebelt.hasTile(zoomUp1, tile)) hasTiles = false;
  });
  t.true(zoomUp1HasTiles, '0,0,0 zoomUp1 has tiles');

  var zoomUp2 = tilesToZoom([[0,0,0]],2);
  t.equal(zoomUp2.length, 16, 'zoom in 2x has 16 tiles');

  var zoomUp5 = tilesToZoom([[0,0,0]],5);
  t.equal(zoomUp5.length, 1024, 'zoom in 5x has 1024 tiles');

  var zoomUp8 = tilesToZoom([[0,0,0]],8);
  t.equal(zoomUp8.length, 65536, 'zoom in 5x has 65536 tiles');

  var zoomDown1 = tilesToZoom([[1,1,1]],0);
  t.equal(zoomDown1.length, 1, '[1,1,1] at zoom 0 has 1 tile');
  t.equal(zoomDown1.toString(), [0,0,0].toString(), '[1,1,1] zoomed out should be [0,0,0]');

  var zoomDown2 = tilesToZoom([[9372,12536,15]],13);
  t.equal(zoomDown2.length, 1, '[9372,12536,15] at zoom 13 has 1 tile');
  t.equal(zoomDown2.toString(), [2343,3134,13].toString(), 'expected tile');

  t.end();
});
