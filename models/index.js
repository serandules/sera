var fs = require('fs');

var files = fs.readdirSync(__dirname);

var ignored = ['index.js'];

files.forEach(function (name) {
  if (ignored.indexOf(name) !== -1) {
    return;
  }

  module.exports[name] = require('./' + name);
});
