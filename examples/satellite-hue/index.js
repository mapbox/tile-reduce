'use strict';

var tileReduce = require('../../src');
var fs = require('fs');
var path = require('path');

var numFeatures = 0;

if (!fs.existsSync(path.join(__dirname, '../../data'))) fs.mkdirSync(path.join(__dirname, '../../data'));

tileReduce({
  bbox: [-122.02, 36.98, -122.0, 37.0],
  zoom: 15,
  map: path.join(__dirname, '/map.js'),
  sources: [
    {
      type: 'remote',
      name: 'satellite',
      url: 'https://b.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=' + process.env.MapboxAccessToken,
      raw: false
    }
  ]
});

