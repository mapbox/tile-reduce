var test = require('tape');
var cover = require('tile-cover').tiles;
var sendTiles = require('../').sendTiles;

test('sendTiles - maxrate 50', function(t){
  var geom = {
    "type": "Polygon",
    "coordinates": [
      [
        [
          -121.61659240722658,
          38.45681495946778
        ],
        [
          -121.61659240722658,
          38.662458581979436
        ],
        [
          -121.32064819335939,
          38.662458581979436
        ],
        [
          -121.32064819335939,
          38.45681495946778
        ],
        [
          -121.61659240722658,
          38.45681495946778
        ]
      ]
    ]
  };

  var tiles = cover(geom, {min_zoom: 15, max_zoom: 15});
  var maxrate = 50;
  opts = {
    zoom: 12,
    tileLayers: [
        {
          name: 'streets',
          url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
          layers: ['road']
        }
      ],
    map: __dirname+'/count.js'
  };

  var persec = 0;
  var requests = 0;
  var interval = setInterval(function(){
    t.pass(persec);
    persec = 0;
    if(requests >= tiles.length) clearInterval(interval);
  },1000);

  var workers = [
    {
      send: function(message){
        persec++;
        if(persec > maxrate) t.fail(persec + ' ops/sec');
        requests++;
      }
    }
  ];

  sendTiles(maxrate, workers, tiles, opts);

  t.end();
});

test('sendTiles - maxrate 200', function(t){
  var geom = {
    "type": "Polygon",
    "coordinates": [
      [
        [
          -121.61659240722658,
          38.45681495946778
        ],
        [
          -121.61659240722658,
          38.662458581979436
        ],
        [
          -121.32064819335939,
          38.662458581979436
        ],
        [
          -121.32064819335939,
          38.45681495946778
        ],
        [
          -121.61659240722658,
          38.45681495946778
        ]
      ]
    ]
  };

  var tiles = cover(geom, {min_zoom: 15, max_zoom: 15});
  var maxrate = 200;
  opts = {
    zoom: 12,
    tileLayers: [
        {
          name: 'streets',
          url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
          layers: ['road']
        }
      ],
    map: __dirname+'/count.js'
  };

  var persec = 0;
  var requests = 0;
  var interval = setInterval(function(){
    t.pass(persec);
    persec = 0;
    if(requests >= tiles.length) clearInterval(interval);
  },1000);

  var workers = [
    {
      send: function(message){
        persec++;
        if(persec > maxrate) t.fail(persec + ' ops/sec');
        requests++;
      }
    }
  ];

  sendTiles(maxrate, workers, tiles, opts);

  t.end();
});

