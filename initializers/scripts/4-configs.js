var log = require('logger')('initializers:serandives:configs');
var _ = require('lodash');
var nconf = require('nconf');
var async = require('async');

var sera = require('sera');
var commons = require('../commons');

var create = function (user, config, added) {
  var name = config.name;
  var value = config.value;
  var permissions = config.permissions;
  var visibility = config.visibility;
  var workflow = config.workflow;
  var status = config.status;
  sera.model('configs').findOne({
    name: name
  }).exec(function (err, config) {
    if (err) {
      return added(err);
    }
    if (config) {
      return added();
    }
    sera.model('configs').create({
      user: user,
      name: name,
      value: JSON.stringify(value),
      permissions: permissions,
      visibility: visibility,
      workflow: workflow,
      status: status,
      _: {}
    }, function (err, config) {
      if (err) {
        return added(err);
      }
      log.info('configs:created', 'name:%s', name);
      added();
    });
  });
};

module.exports = function (done) {
  var configs = [];
  commons.meta(function (err, o) {
    var facebookId = nconf.get('FACEBOOK_ID');
    var googleKey = nconf.get('GOOGLE_KEY');
    var staticsCDN = nconf.get('CDN_STATICS');
    var imagesCDN = nconf.get('CDN_IMAGES');
    var serandivesId = o.client.id;
    // boots
    var visibility = o.visibility;
    visibility.name = {
      groups: [o.public._id, o.anonymous._id]
    };
    visibility.value = {
      groups: [o.public._id, o.anonymous._id]
    };
    configs.push({
      user: o.adminUser,
      name: 'boot',
      value: {
        clients: {
          facebook: {
            id: facebookId,
            login: nconf.get('FACEBOOK_LOGIN_URI')
          },
          serandives: {
            id: serandivesId
          }
        },
        googleKey: googleKey,
        cdns: {
          statics: staticsCDN,
          images: imagesCDN
        }
      },
      permissions: o.permissions,
      visibility: visibility,
      workflow: o.workflows.model,
      status: 'published'
    });
    // groups
    configs.push({
      user: o.adminUser,
      name: 'groups',
      value: [{
        id: o.anonymous.id,
        name: o.anonymous.name,
        description: o.anonymous.description
      }, {
        id: o.public.id,
        name: o.public.name,
        description: o.public.description
      }, {
        id: o.admin.id,
        name: o.admin.name,
        description: o.admin.description
      }],
      permissions: o.permissions,
      visibility: visibility,
      workflow: o.workflows.model,
      status: 'published'
    });
    // groups
    configs.push({
      user: o.adminUser,
      name: 'users',
      value: {
        admin: o.adminUser.id,
        support: o.supportUser.id,
        talk: o.talkUser.id
      },
      permissions: o.permissions,
      visibility: visibility,
      workflow: o.workflows.model,
      status: 'published'
    });
    async.each(configs, function (config, added) {
      create(o.adminUser, config, added);
    }, done);
  });
};
