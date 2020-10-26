var log = require('logger')('initializers:serandives:users');
var nconf = require('nconf');
var utils = require('utils');

var sera = require('sera');

var adminEmail = utils.adminEmail();
var supportEmail = utils.supportEmail();
var talkEmail = utils.talkEmail();

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
        var supportUser = {
          email: supportEmail,
          password: encrypted,
          username: 'support',
          status: 'registered',
          createdAt: new Date(),
          modifiedAt: new Date(),
          visibility: {},
          permissions: {},
          _: {}
        };
        sera.model('users').create(supportUser, function (err, supportUser) {
          if (err) {
            return done(err);
          }
          sera.model('users').update({_id: supportUser._id}, {
            permissions: [{
              user: supportUser._id,
              actions: ['read', 'update', 'delete']
            }],
            visibility: {
              '*': {
                users: [String(supportUser._id)]
              }
            }
          }, function (err) {
            if (err) {
              return done(err);
            }
            var talkUser = {
              email: talkEmail,
              password: encrypted,
              username: 'talk',
              status: 'registered',
              createdAt: new Date(),
              modifiedAt: new Date(),
              visibility: {},
              permissions: {},
              _: {}
            };
            sera.model('users').create(talkUser, function (err, talkUser) {
              if (err) {
                return done(err);
              }
              sera.model('users').update({_id: talkUser._id}, {
                permissions: [{
                  user: talkUser._id,
                  actions: ['read', 'update', 'delete']
                }],
                visibility: {
                  '*': {
                    users: [String(talkUser._id)]
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
        });
      });
    });
  });
};
