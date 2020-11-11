var log = require('logger')('service-users:xactions:recover');
var async = require('async');
var fs = require('fs');
var path = require('path');
var dust = require('dustjs-linkedin');
var util = require('util');

var messenger = require('messenger');

var utils = require('../../../utils');
var middlewares = require('../../../middlewares');
var services = require('../../../services');
var Otps = require('../../otps/model');
var Users = require('../model');

var template = function (name) {
  var data = fs.readFileSync(path.join(__dirname, '..', 'templates', name + '.html'));
  dust.loadSource(dust.compile(String(data), 'service-users-' + name));
};

template('recover');

var recover = function (user, done) {
  Otps.remove({
    user: user.id,
    name: 'accounts-update'
  }, function (err) {
    if (err) {
      return done(err);
    }
    services.create({
      user: user,
      model: Otps,
      data: {
        name: 'accounts-update'
      },
      overrides: {}
    }, function (err, otp) {
      if (err) {
        log.error('create:errored', 'user:%j', user, err);
        return done(err);
      }
      var ctx = {
        user: user,
        title: 'Reset your password',
        reset: utils.resolve(util.format('accounts:///reset?user=%s&email=%s&username=%s&otp=%s',
          user.id, user.email, user.username, otp.strong))
      };
      dust.render('service-users-recover', ctx, function (err, html) {
        if (err) {
          return done(err);
        }
        messenger.email({
          from: 'Serandives <no-reply@serandives.com>',
          to: user.email,
          subject: ctx.title,
          html: html,
          text: html
        }, done);
      });
    });
  });
};

module.exports = function (route) {
  route.use(middlewares.json);
  route.use(middlewares.captcha);
  route.use(middlewares.query);

  route.use(function (req, res, next) {
    req.ctx.previleged = true;
    next();
  });

  route.use(middlewares.find(Users));

  route.use(function (req, res, next) {
    var ctx = req.ctx;
    ctx.search.count = 1;
    next();
  });

  route.use(function (req, res, next) {
    services.find(req.ctx, function (err, users, paging) {
      if (err) {
        return next(err);
      }
      async.each(users, function (user, recovered) {
        recover(user, recovered);
      }, function (err) {
        if (err) {
          return next(err);
        }
        res.status(204).end();
      });
    });
  });
};
