
exports.model = require('./model');

exports.service = function (done) {
  done(null, {
    find: true,
    findOne: true,
    createOne: true,
    updateOne: true,
    replaceOne: true,
    removeOne: true
  });
};