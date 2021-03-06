var log = require('logger')('initializers:serandives:users');
var nconf = require('nconf');

var sera = require('../../index');
var utils = require('../../utils');

var adminEmail = utils.adminEmail();

module.exports = function (done) {
  var suPass = nconf.get('PASSWORD');
  if (!suPass) {
    return done('su password cannot be found');
  }
  utils.encrypt(suPass, function (err, encrypted) {
    if (err) {
      return done(err);
    }
    var adminUser = {
      email: adminEmail,
      password: encrypted,
      username: 'admin',
      status: 'registered',
      createdAt: new Date(),
      modifiedAt: new Date(),
      visibility: {},
      permissions: {},
      _: {}
    };
    sera.model('users').create(adminUser, function (err, adminUser) {
      if (err) {
        return done(err);
      }
      sera.model('users').update({_id: adminUser._id}, {
        permissions: [{
          user: adminUser._id,
          actions: ['read', 'update', 'delete']
        }],
        visibility: {
          '*': {
            users: [String(adminUser._id)]
          }
        }
      }, function (err) {
        if (err) {
          return done(err);
        }
        log.info('users:created');
        done();
      });
    });
  });
};
