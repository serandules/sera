var log = require('logger')('service-configs');

var find = require('./find');

module.exports = function (done) {
  done(null, {
    findOne: true,
    find: true,
    createOne: true,
    updateOne: true,
    replaceOne: true
  });
};