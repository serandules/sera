var log = require('logger')('initializers:serandives:groups');

var sera = require('../../index');
var utils = require('../../utils');

var adminEmail = utils.adminEmail();

module.exports = function (done) {
  sera.model('users').findOne({email: adminEmail}, function (err, adminUser) {
    if (err) {
      return done(err);
    }
    sera.model('workflows').findOne({user: adminUser, name: 'model'}, function (err, workflow) {
      if (err) {
        return done(err);
      }
      sera.model('groups').create({
        user: adminUser,
        name: 'admin',
        description: 'serandives.com admin group',
        workflow: workflow,
        status: workflow.start,
        visibility: {},
        permissions: {},
        _: {}
      }, function (err, admin) {
        if (err) {
          return done(err);
        }
        sera.model('groups').update({_id: admin._id}, {
          permissions: [{
            user: adminUser._id,
            actions: ['read', 'update', 'delete']
          }, {
            group: admin._id,
            actions: ['read', 'update', 'delete']
          }],
          visibility: {
            '*': {
              users: [adminUser._id],
              groups: [admin._id]
            }
          }
        }, function (err) {
          if (err) {
            return done(err);
          }
          sera.model('groups').create({
            user: adminUser,
            name: 'public',
            description: 'serandives.com public group',
            workflow: workflow,
            status: workflow.start,
            visibility: {},
            permissions: {},
            _: {}
          }, function (err, pub) {
            if (err) {
              return done(err);
            }
            sera.model('groups').update({_id: pub._id}, {
              permissions: [{
                user: adminUser._id,
                actions: ['read', 'update', 'delete']
              }, {
                group: admin._id,
                actions: ['read', 'update', 'delete']
              }, {
                group: pub._id,
                actions: ['read']
              }],
              visibility: {
                '*': {
                  users: [adminUser._id],
                  groups: [admin._id]
                }
              }
            }, function (err) {
              if (err) {
                return done(err);
              }
              sera.model('groups').create({
                user: adminUser,
                name: 'anonymous',
                description: 'serandives.com anonymous group',
                workflow: workflow,
                status: workflow.start,
                visibility: {},
                permissions: {},
                _: {}
              }, function (err, anon) {
                if (err) {
                  return done(err);
                }
                sera.model('groups').update({_id: anon._id}, {
                  permissions: [{
                    user: adminUser._id,
                    actions: ['read', 'update', 'delete']
                  }, {
                    group: admin._id,
                    actions: ['read', 'update', 'delete']
                  }, {
                    group: anon._id,
                    actions: ['read']
                  }],
                  visibility: {
                    '*': {
                      users: [adminUser._id],
                      groups: [admin._id]
                    }
                  }
                }, function (err) {
                  if (err) {
                    return done(err);
                  }
                  sera.model('users').update({_id: adminUser.id}, {
                    groups: [admin.id, pub.id],
                    visibility: {
                      '*': {
                        users: [adminUser.id]
                      },
                      'username': {
                        groups: [anon.id, pub.id]
                      }
                    },
                    permissions: [{
                      user: adminUser._id,
                      actions: ['read', 'update', 'delete']
                    }, {
                      group: pub._id,
                      actions: ['read']
                    }, {
                      group: anon._id,
                      actions: ['read']
                    }]
                  }, function (err) {
                    if (err) {
                      return done(err);
                    }
                    log.info('groups:created');
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};
