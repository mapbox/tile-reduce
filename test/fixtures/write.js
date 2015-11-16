'use strict';

module.exports = function(data, tile, writeData, done) {
  writeData('{"foo": [100, 200, 300], "hello": "world"},');
  done(null, 1);
};
