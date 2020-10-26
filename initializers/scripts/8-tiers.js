var log = require('logger')('initializers:serandives:tiers');

var sera = require('sera');
var commons = require('../commons');

module.exports = function (done) {
  commons.meta(function (err, o) {
    if (err) {
      return done(err);
    }
    sera.model('tiers').create({
      user: o.adminUser,
      name: 'free',
      description: 'serandives.com free tier',
      apis: {
        vehicles: {
          find: {
            second: 100,
            day: 10000,
            month: 100000
          },
          create: {
            second: 1,
            day: 10,
            month: 100
          }
        }
      },
      ips: {
        find: {
          second: 10,
          minute: 500,
          hour: 5000,
          day: 50000
        },
        create: {
          second: 10,
          minute: 100,
          hour: 500,
          day: 1000
        }
      },
      workflow: o.workflows.model,
      status: o.workflows.model.start,
      visibility: {},
      permissions: {},
      _: {}
    }, function (err, free) {
      if (err) {
        return done(err);
      }
      sera.model('tiers').create({
        user: o.adminUser,
        name: 'basic',
        description: 'serandives.com basic tier',
        apis: {
          contacts: {
            confirm: {
              minute: 2,
              day: 10,
              month: 30
            },
            verify: {
              minute: 2,
              day: 10,
              month: 30
            }
          },
          vehicles: {
            find: {
              second: 10,
              day: 10000,
              month: 100000
            },
            create: {
              second: 1,
              day: 10,
              month: 100
            },
            bumpup: {
              second: 1,
              day: 10,
              month: 100
            }
          },
          realestates: {
            find: {
              second: 10,
              day: 10000,
              month: 100000
            },
            create: {
              second: 1,
              day: 10,
              month: 100
            },
            bumpup: {
              second: 1,
              day: 10,
              month: 100
            }
          }
        },
        ips: {
          find: {
            second: 10,
            minute: 500,
            hour: 5000,
            day: 50000
          },
          create: {
            second: 10,
            minute: 100,
            hour: 500,
            day: 1000
          }
        },
        workflow: o.workflows.model,
        status: o.workflows.model.start,
        visibility: {},
        permissions: {},
        _: {}
      }, function (err, free) {
        if (err) {
          return done(err);
        }
        sera.model('tiers').create({
          user: o.adminUser,
          name: 'unlimited',
          description: 'serandives.com unlimited tier',
          apis: {
            '*': {
              '*': {
                second: Number.MAX_VALUE,
                day: Number.MAX_VALUE,
                month: Number.MAX_VALUE
              }
            }
          },
          ips: {
            '*': {
              second: Number.MAX_VALUE,
              day: Number.MAX_VALUE,
              month: Number.MAX_VALUE
            }
          },
          workflow: o.workflows.model,
          status: o.workflows.model.start,
          visibility: {},
          permissions: {},
          _: {}
        }, function (err, admin) {
          if (err) {
            return done(err);
          }
          log.info('tiers:created');
          done();
        });
      });
    });
  });
};
