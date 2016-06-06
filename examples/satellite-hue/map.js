'use strict';

var path = require('path');

module.exports = function(data, tile, writeData, done) {
  data.satellite.hue(180, function (err, img) {
    img.writeFile(path.join(__dirname, '../../data', tile[0] + '-' + tile[1] + '-' + tile[2] + '.jpg'), 'jpg', function () {
      done();
    });
  });
};
