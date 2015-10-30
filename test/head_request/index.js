var test = require('tape');
var TileReduce = require('../../');

test('head request', function(t){
  var bbox = [20966,50661,17];

  var opts = {
    zoom: 17,
    tileLayers: [
        {
          name: 'streets',
          url: 'https://b.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibWF0dCIsImEiOiJTUHZkajU0In0.oB-OGTMFtpkga8vC48HjIg',
          layers: []
        }
      ],
    map: __dirname + '/head.js',
    requestMethod: 'HEAD'
  };

  var filesize = 0;
  var tilereduce = TileReduce(bbox, opts);

  tilereduce.on('start', function(tiles){
    t.pass('tilereduce started');
    t.equal(tiles.length, 1, '1 tile covered');
    var allValid = tiles.every(function(tile){
      return tile.length === 3;
    });
    t.true(allValid, 'all tiles are valid');
  });

  tilereduce.on('reduce', function(result){
    filesize += result;
  });

  tilereduce.on('end', function(){
    var minFilesize = 20000;
    t.true(filesize > minFilesize, 'filesize at least ' + minFilesize + ' (' + filesize + ')');
    t.pass('tilereduce completed');
    t.end();
  });

  tilereduce.on('error', function(error){
    throw error;
  });

  tilereduce.run();
});