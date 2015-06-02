var test = require('tape');
var http = require('http');
var TileReduce = require('../../');

test('throttle', function(t){
  var requests = 0;
  var persec = 0;
  var interval = setInterval(function(){
    t.pass(persec)
    persec = 0;
  },1000);

  var server = http.createServer(function (req, res) {
    requests++;
    persec++;
    if(persec > 10) t.fail(persec+' requests per second');
    res.end();
  });

  server.listen(8000, function(){
    t.pass('server listening on 8000');
    var bbox = [
      -77.16350555419922,
      38.81135594620186,
      -76.9379425048828,
      38.965815660189016
      ];

    var opts = {
      zoom: 13,
      maxrate: 200,
      tileLayers: [
          {
            name: 'streets',
            url: 'http://127.0.0.1:8000/{z}/{x}/{y}',
            layers: ['road']
          }
        ],
      map: __dirname+'/pass.js'
    };

    var tilereduce = TileReduce(bbox, opts);

    tilereduce.on('start', function(tiles){
      t.pass('tilereduce started');
      t.equal(tiles.length, 36, '1554 tiles covered');
      var allValid = tiles.every(function(tile){
        return tile.length === 3;
      });
      t.true(allValid, 'all tiles are valid');
    });

    tilereduce.on('reduce', function(result){

    });

    tilereduce.on('end', function(){
      t.equal(requests, 36);
      clearInterval(interval);
      server.close(function(){
        t.pass('server closed');
        t.end();
      });
    });

    tilereduce.run();
  });
});