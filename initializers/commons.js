var _ = require('lodash');
var util = require('util');
var sera = require('../index');

var utils = require('../utils');
var adminUser = utils.adminEmail();
var domain = utils.domain();

exports.meta = function (done) {
  sera.model('users').findOne({email: adminUser}, function (err, adminUser) {
    if (err) {
      return done(err);
    }
    sera.model('clients').findOne({name: domain}).exec(function (err, client) {
      if (err) {
        return done(err);
      }
      if (!client) {
        return done(new Error(util.format('No client with name %s can be found.', domain)));
      }
      sera.model('workflows').find({user: adminUser}, function (err, workflows) {
        if (err) {
          return done(err);
        }
        sera.model('groups').find({
          user: client.user,
          name: {$in: ['public', 'admin', 'anonymous']}
        }, function (err, groups) {
          if (err) {
            return done(err);
          }
          var groupz = {};
          groups.forEach(function (group) {
            groupz[group.name] = group;
          });
          var permissions = [{
            user: client.user,
            actions: ['read', 'update', 'delete', 'unpublish']
          }, {
            group: groupz.admin._id,
            actions: ['read', 'update', 'delete', 'unpublish']
          }, {
            group: groupz.public._id,
            actions: ['read']
          }, {
            group: groupz.anonymous._id,
            actions: ['read']
          }];
          var visibility = {
            '*': {
              users: [client.user._id],
              groups: [groupz.admin._id]
            }
          };
          done(null, {
            adminUser: adminUser,
            client: client,
            permissions: permissions,
            visibility: visibility,
            workflows: _.keyBy(workflows, 'name'),
            admin: groupz.admin,
            public: groupz.public,
            anonymous: groupz.anonymous
          });
        });
      });
    });
  });
};
