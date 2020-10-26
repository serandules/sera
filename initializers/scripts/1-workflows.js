var log = require('logger')('initializers:serandives:workflows');
var utils = require('utils');

var sera = require('sera');

var adminEmail = utils.adminEmail();

module.exports = function (done) {
  sera.model('users').findOne({email: adminEmail}, function (err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done('No user with email %s can be found.', adminEmail);
    }
    workflowModel(user, function (err) {
      if (err) {
        return done(err);
      }
      workflowModelUsers(user, function (err) {
        if (err) {
          return done(err);
        }
        workflowModelClients(user, function (err) {
          if (err) {
            return done(err);
          }
          workflowModelMessages(user, function (err) {
            if (err) {
              return done(err);
            }
            log.info('workflow:created');
            done();
          });
        });
      });
    });
  });
};

var workflowModel = function (user, done) {
  sera.model('workflows').create({
    name: 'model',
    user: user,
    _: {},
    start: 'editing',
    transitions: {
      editing: {
        review: 'reviewing'
      },
      reviewing: {
        approve: 'unpublished',
        reject: 'editing'
      },
      published: {
        unpublish: 'unpublished',
        bumpup: 'published'
      },
      unpublished: {
        publish: 'published',
        edit: 'editing'
      }
    },
    permits: {
      editing: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          }
        },
        user: {
          actions: ['read', 'update', 'delete', 'review'],
          visibility: ['*']
        }
      },
      reviewing: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          }
        },
        user: {
          actions: ['read', 'delete', 'reject'],
          visibility: ['*']
        }
      },
      published: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          },
          public: {
            actions: ['read'],
            visibility: ['*']
          },
          anonymous: {
            actions: ['read'],
            visibility: ['*']
          }
        },
        user: {
          actions: ['read', 'unpublish', 'bumpup'],
          visibility: ['*']
        }
      },
      unpublished: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          }
        },
        user: {
          actions: ['read', 'delete', 'publish', 'edit'],
          visibility: ['*']
        }
      }
    },
    visibility: {},
    permissions: {}
  }, done);
};

var workflowModelUsers = function (user, done) {
  sera.model('workflows').create({
    name: 'model-users',
    user: user,
    _: {},
    start: 'signup',
    transitions: {
      signup: {
        verify: 'registered'
      },
      registered: {
        recover: 'registered',
        block: 'blocked'
      },
      blocked: {
        unblock: 'registered'
      }
    },
    permits: {
      signup: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          },
          public: {
            actions: ['read'],
            visibility: ['id', 'username', 'avatar']
          },
          anonymous: {
            actions: ['read'],
            visibility: ['id', 'username', 'avatar']
          }
        },
        user: {
          actions: ['read', 'verify'],
          visibility: ['*']
        }
      },
      registered: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          },
          public: {
            actions: ['read'],
            visibility: ['id', 'username', 'avatar']
          },
          anonymous: {
            actions: ['read'],
            visibility: ['id', 'username', 'avatar']
          }
        },
        user: {
          actions: ['read', 'update', 'recover', 'block'],
          visibility: ['*']
        }
      },
      blocked: {
        groups: {
          admin: {
            actions: ['*', 'unblock'],
            visibility: ['*']
          },
          public: {
            actions: ['read'],
            visibility: ['id', 'username', 'avatar']
          },
          anonymous: {
            actions: ['read'],
            visibility: ['id', 'username', 'avatar']
          }
        },
        user: {
          actions: ['read', 'update'],
          visibility: ['*']
        }
      }
    },
    visibility: {},
    permissions: {}
  }, done);
};

var workflowModelClients = function (user, done) {
  sera.model('workflows').create({
    name: 'model-clients',
    user: user,
    _: {},
    start: 'sandbox',
    transitions: {
      sandbox: {
        move: 'production'
      },
      production: {
        move: 'sandbox'
      }
    },
    permits: {
      sandbox: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          }
        },
        user: {
          actions: ['read', 'update', 'delete', 'move'],
          visibility: ['*']
        }
      },
      production: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          },
          public: {
            actions: ['read'],
            visibility: ['name', 'to', 'description']
          },
          anonymous: {
            actions: ['read'],
            visibility: ['name', 'to', 'description']
          }
        },
        user: {
          actions: ['read', 'update', 'delete', 'move'],
          visibility: ['*']
        }
      }
    },
    visibility: {},
    permissions: {}
  }, done);
};

var workflowModelMessages = function (user, done) {
  sera.model('workflows').create({
    name: 'model-messages',
    user: user,
    _: {},
    start: 'sent',
    transitions: {
      sent: {
        receive: 'received'
      },
      received: {
        unreceive: 'sent'
      }
    },
    permits: {
      sent: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          }
        },
        model: {
          to: {
            user: {
              actions: ['read', 'receive', 'delete'],
              visibility: ['*']
            }
          }
        },
        user: {
          actions: ['read', 'update', 'delete'],
          visibility: ['*']
        }
      },
      received: {
        groups: {
          admin: {
            actions: ['*'],
            visibility: ['*']
          }
        },
        model: {
          to: {
            user: {
              actions: ['read', 'unreceive', 'delete'],
              visibility: ['*']
            }
          }
        },
        user: {
          actions: ['read'],
          visibility: ['*']
        }
      }
    },
    visibility: {},
    permissions: {}
  }, done);
};
