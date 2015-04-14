var glob = require('glob');

glob(__dirname+'/*/', function (err, dirs) {
  dirs.forEach(function(dir){
    require(dir+'/index.js');
  });
});
