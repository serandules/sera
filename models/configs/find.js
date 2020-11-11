var _ = require('lodash');
var utils = require('../../utils');

var Users = require('../users/model');
var Configs = require('../configs/model');

module.exports = function (done) {
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
      name: {$in: ['boot', 'groups']},
      user: root.id
    }, function (err, configs) {
      if (err) {
        return done(err);
      }
      done(null, configs);
    });
  });
};
