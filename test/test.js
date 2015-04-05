var glob = require('glob');

glob(__dirname+'/*', function (err, dirs) {
  dirs.forEach(function(dir){
    console.log(dir+'/index.js')
    require(dir+'/index.js');
  });
});