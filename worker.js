process.on('message', function(data) {
  var mapOperation = require(data.opts.map);
  mapOperation(data.collection, data.tile, function(err, message){
    process.send(message);
  });
});
