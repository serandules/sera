var log = require('logger')('model-tokens');
var mongoose = require('mongoose');
var autopopulate = require('mongoose-autopopulate');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var _ = require('lodash');

var Lock = require('lock');
var permission = require('permission');
var plugins = require('../../plugins');
var validators = require('../../validators');

var types = validators.types;
var values = validators.values;

var TOKEN_LENGTH = 48;
var TOKEN_SIZE = 2 * TOKEN_LENGTH;

var accessibility = 365 * 24 * 60 * 60000;
var refreshability = 10 * accessibility;

var schema = Schema({
  has: {
    type: Object,
    default: {
      '*': {
        '': ['*']
      }
    }
  },
  limits: {
    type: Object,
    server: true
  },
  access: {
    type: String,
    server: true,
    index: true,
    validator: types.string({
      length: TOKEN_SIZE
    }),
    value: values.random({size: TOKEN_LENGTH})
  },
  accessible: {type: Number, default: accessibility},
  refresh: {
    type: String,
    server: true,
    index: true,
    validator: types.string({
      length: TOKEN_SIZE
    }),
    value: values.random({size: TOKEN_LENGTH})
  },
  refreshable: {type: Number, default: refreshability},
  client: {
    type: Schema.Types.ObjectId,
    ref: 'clients',
    required: true,
    index: true,
    validator: types.ref(),
    autopopulate: true
  },
  tier: {
    type: Schema.Types.ObjectId,
    ref: 'tiers',
    required: true,
    validator: types.ref(),
    value: values.tier(),
    autopopulate: true,
    server: true
  },
  cors: {
    type: [String],
    validator: types.cors({
      max: 10
    })
  }
}, {collection: 'tokens'});

schema.plugin(plugins());
schema.plugin(plugins.user());
schema.plugin(plugins._());
schema.plugin(plugins.visibility());
schema.plugin(plugins.permissions());
schema.plugin(plugins.createdAt());
schema.plugin(plugins.updatedAt());
schema.plugin(plugins.modifiedAt());

schema.plugin(autopopulate);

schema.methods.accessibility = function () {
  var exin = this.createdAt.getTime() + this.accessible - new Date().getTime();
  return exin > 0 ? exin : 0;
};

schema.methods.refreshability = function () {
  var exin = this.createdAt.getTime() + this.refreshable - new Date().getTime();
  return exin > 0 ? exin : 0;
};

schema.methods.can = function (perm, action, o) {
  var permissions = o.permissions;
  if (!permissions) {
    return false;
  }
  var user = this.user;
  var entry = _.find(permissions, function (o) {
    return String(o.user) === user.id;
  });
  if (!entry) {
    return false;
  }
  var actions = entry.actions;
  if (actions.indexOf(action) === -1) {
    return false;
  }
  var trees = [this.has, this.client.has];
  return permission.every(trees, perm, action);
};

schema.statics.search = function (value, cb) {
  this.findOne({
    value: value
  }).select('updatedAt accessible').exec(function (err, token) {
    cb(err, (err || !token) ? false : token);
  });
};

schema.statics.refresh = function (id, done) {
  var Token = this;
  Lock.acquire('refresh-' + id, function (err, release) {
    if (err) {
      return done(err);
    }
    crypto.randomBytes(TOKEN_LENGTH, function (err, buf) {
      if (err) {
        release();
        return done(err);
      }
      Token.update({_id: id}, {
        access: buf.toString('hex'),
        createdAt: Date.now()
      }, function (err) {
        release();
        done(err);
      });
    });
  });
};

module.exports = mongoose.model('tokens', schema);
