var tileReduce = require('./');
var Benchmark = require('benchmark');
var path = require('path');

var suite = new Benchmark.Suite('tileReduce');
suite
  .add('tileReduce#count',function (deferred) {
    var numFeatures = 0;
    tileReduce({
      maxWorkers: 1,
      bbox: [-122.05862045288086, 36.93768132842635, -121.97296142578124, 37.00378647456494],
      zoom: 15,
      map: path.join(__dirname, 'test/fixtures/count.js'),
      sources:[
        {name: 'osm', mbtiles: path.join(__dirname, 'test/fixtures/osm.mbtiles'), raw: true},
        {name: 'tiger', mbtiles: path.join(__dirname, 'test/fixtures/tiger.mbtiles'), raw: true}
      ],
      log: false
    })
    .on('reduce', function(num) {
      numFeatures += num;
    })
    .on('end', function() {
      deferred.resolve();
    });
  }, {defer: true})
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .on('complete', function () { })
  .run();
