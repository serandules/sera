var log = require('logger')('models:users:service');
var bodyParser = require('body-parser');
var dust = require('dustjs-linkedin');
var path = require('path');
var util = require('util');
var fs = require('fs');

var errors = require('errors');
var messenger = require('messenger');

var middlewares = require('../../middlewares');
var utils = require('../../utils');
var services = require('../../services');
var validators = require('./validators');
var Users = require('./model');
var Otps = require('../otps/model');

var template = function (name) {
  var data = fs.readFileSync(path.join(__dirname, 'templates', name + '.html'));
  dust.loadSource(dust.compile(String(data), 'service-users-' + name));
};

template('signup');

var xactions = {
  post: {
    recover: require('./xactions/recover'),
    reset: require('./xactions/reset'),
    confirm: require('./xactions/confirm')
  }
};

module.exports = function (done) {
  var service = {
    auth: {
      GET: [
        '^\/$',
        '^\/.*'
      ],
      POST: [
        '^\/$',
        '^\/.*'
      ],
      PUT: [
        '^\/.*'
      ]
    },
    xactions: xactions,
    workflow: 'model-users',
    updateOne: true,
    find: true
  };

  service.createOne = function (req, res, next) {
    middlewares.serve(req, res, next,
      middlewares.xactions(xactions.post),
      bodyParser.json(),
      middlewares.json,
      middlewares.captcha,
      middlewares.create(Users),
      function (req, res, next) {
        services.create(req.ctx, function (err, user) {
          if (err) {
            if (err.code === errors.mongoose.DuplicateKey) {
              return next(errors.conflict());
            }
            return next(err);
          }
          utils.workflow('model-users', function (err, workflow) {
            if (err) {
              return next(err);
            }
            var usr = utils.json(user);
            utils.toPermissions(usr.id, workflow, workflow.start, usr, function (err, permissions) {
              if (err) {
                return next(err);
              }
              utils.toVisibility(usr.id, workflow, workflow.start, usr, function (err, visibility) {
                if (err) {
                  return next(err);
                }
                Users.findOneAndUpdate({_id: usr.id}, {
                  permissions: permissions,
                  visibility: visibility
                }).exec(function (err) {
                  if (err) {
                    return next(err);
                  }
                  services.create({
                    user: user,
                    model: Otps,
                    data: {
                      name: 'accounts-confirm'
                    },
                    overrides: {}
                  }, function (err, otp) {
                    if (err) {
                      return next(err);
                    }
                    var ctx = {
                      user: user,
                      title: 'Welcome',
                      confirm: utils.resolve(util.format('accounts:///confirm?user=%s&email=%s&otp=%s', user.id, user.email, otp.strong))
                    };
                    dust.render('service-users-signup', ctx, function (err, html) {
                      if (err) {
                        return next(err);
                      }
                      messenger.email({
                        from: 'Serandives <no-reply@serandives.com>',
                        to: user.email,
                        subject: ctx.title,
                        html: html,
                        text: html
                      }, function (err) {
                        if (err) {
                          return next(err);
                        }
                        res.locate(user.id).status(201).send(user);
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

  service.findOne = function (req, res, next) {
    middlewares.serve(req, res, next,
      middlewares.id,
      middlewares.findOne(Users),
      function (req, res, next) {
        services.findOne(req.ctx, function (err, user) {
          if (err) {
            return next(err);
          }
          var name;
          var opts = [];
          for (name in user.addresses) {
            if (user.addresses.hasOwnProperty(name)) {
              opts.push({
                model: 'Location',
                path: 'addresses.' + name + '.location'
              });
            }
          }
          Users.populate(user, opts, function (err, user) {
            if (err) {
              return next(err);
            }
            res.send(user);
          });
        });
      });
  };

  service.replaceOne = function (req, res, next) {
    middlewares.serve(req, res, next,
      middlewares.id,
      middlewares.json,
      validators.update,
      function (req, res, next) {
        services.update(req.ctx, function (err, o) {
          if (err) {
            return next(err);
          }
          res.locate(o.id).status(200).send(o);
        });
      });
  };

  done(null, service);
};