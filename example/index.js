var TileReduce = require('../');

var bbox = [
  -88.49761962890625,
  42.767178634023345,
  -87.70111083984375,
  43.36911908773858
  ];

var opts = {
  zoom: 15,
  tileLayers: [
      {
        name: 'streets',
        url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
        layers: ['road', 'bridge', 'tunnel']
      },
      {
        name: 'runkeeper',
        url: 'https://a.tiles.mapbox.com/v4/enf.8t2tvs4i/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibW9yZ2FuaGVybG9ja2VyIiwiYSI6Ii1zLU4xOWMifQ.FubD68OEerk74AYCLduMZQ',
        layers: ['runkeeper']
      }
    ],
  map: __dirname+'/trace.js'
};

var tilereduce = TileReduce(bbox, opts);
tilereduce.on('reduce', function(result){
  if(result.features.length > 0) console.log(JSON.stringify(result));
});
tilereduce.run();