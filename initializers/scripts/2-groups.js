var log = require('logger')('initializers:serandives:groups');

var utils = require('utils');

var sera = require('sera');

var adminEmail = utils.adminEmail();
var supportEmail = utils.supportEmail();
var talkEmail = utils.talkEmail();

module.exports = function (done) {
  sera.model('users').findOne({email: adminEmail}, function (err, adminUser) {
    if (err) {
      return done(err);
    }
    sera.model('users').findOne({email: supportEmail}, function (err, supportUser) {
      if (err) {
        return done(err);
      }
      sera.model('users').findOne({email: talkEmail}, function (err, talkUser) {
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
                name: 'support',
                description: 'serandives.com support group',
                workflow: workflow,
                status: workflow.start,
                visibility: {},
                permissions: {},
                _: {}
              }, function (err, support) {
                if (err) {
                  return done(err);
                }
                sera.model('groups').update({_id: support._id}, {
                  permissions: [{
                    user: supportUser._id,
                    actions: ['read', 'update', 'delete']
                  }, {
                    group: admin._id,
                    actions: ['read', 'update', 'delete']
                  }, {
                    group: support._id,
                    actions: ['read']
                  }],
                  visibility: {
                    '*': {
                      users: [supportUser._id],
                      groups: [admin._id, support._id]
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
                            sera.model('users').update({_id: supportUser.id}, {
                              groups: [support.id, pub.id],
                              visibility: {
                                '*': {
                                  users: [adminUser._id, supportUser.id]
                                },
                                'username': {
                                  groups: [anon.id, pub.id]
                                }
                              },
                              permissions: [{
                                group: admin._id,
                                actions: ['read', 'update', 'delete']
                              }, {
                                user: supportUser._id,
                                actions: ['read', 'update', 'delete']
                              }, {
                                group: support._id,
                                actions: ['read']
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
                              sera.model('users').update({_id: talkUser.id}, {
                                groups: [support.id, pub.id],
                                visibility: {
                                  '*': {
                                    users: [adminUser._id, talkUser.id]
                                  },
                                  'username': {
                                    groups: [anon.id, pub.id]
                                  }
                                },
                                permissions: [{
                                  group: admin._id,
                                  actions: ['read', 'update', 'delete']
                                }, {
                                  user: talkUser._id,
                                  actions: ['read', 'update', 'delete']
                                }, {
                                  group: support._id,
                                  actions: ['read']
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
            });
          });
        });
      });
    });
  });
};
