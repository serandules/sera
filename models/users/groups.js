var utils = require('../../utils');
var Users = require('./model');
var Configs = require('../configs');

exports.find = function (done) {
  Users.findOne({
    email: utils.adminEmail()
  }, function (err, root) {
    if (err) {
      return done(err);
    }
    if (!root) {
      return done(new Error('!root'));
    }
    Configs.find({
      name: {$in: ['boot', 'boot-autos', 'groups']},
      user: root.id
    }, function (err, configs) {
      if (err) {
        return done(err);
      }
      done(null, configs);
    });
  });
};
