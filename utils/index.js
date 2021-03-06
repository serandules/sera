var log = require('logger')('utils');
var nconf = require('nconf');
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var async = require('async');
var AWS = require('aws-sdk');
var Redis = require('ioredis');
var once = require('once');
var diff = require('deep-object-diff').diff;
var uuidv4 = require('uuid/v4');
var stringify = require('json-stringify-safe');
var _ = require('lodash');
var format = require('string-template');

var errors = require('errors');

var ObjectId = mongoose.Types.ObjectId;

var env = nconf.get('ENV');

var SALT_WORK_FACTOR = 10;

var redis;

var serverUrl;

var client;

var modelUpdatesQueueUrl;

var users = {};

var groups = {};

var workflows = {};

var tiers = {};

var s3 = new AWS.S3({
  region: 'ap-southeast-1',
  apiVersion: '2006-03-01',
  accessKeyId: nconf.get('AWS_KEY'),
  secretAccessKey: nconf.get('AWS_SECRET')
});

var sqs = new AWS.SQS({
  region: 'ap-southeast-1',
  apiVersion: '2012-11-05',
  accessKeyId: nconf.get('AWS_KEY'),
  secretAccessKey: nconf.get('AWS_SECRET')
});

var ses = new AWS.SES({
  region: 'eu-west-1',
  apiVersion: '2010-12-01',
  accessKeyId: nconf.get('AWS_KEY'),
  secretAccessKey: nconf.get('AWS_SECRET')
});

var sns = new AWS.SNS({
  region: 'ap-southeast-1',
  apiVersion: '2010-03-31',
  accessKeyId: nconf.get('AWS_KEY'),
  secretAccessKey: nconf.get('AWS_SECRET')
});

var transitable = function (model, o, from, to, done) {
  var schema = model.schema;
  var paths = schema.paths;
  var verified = o._ && o._.verified || {};
  async.eachLimit(Object.keys(paths), 1, function (field, processed) {
    var path = paths[field];
    var options = path.options || {};
    var verify = options.verify;
    if (!verify) {
      return processed();
    }
    if (verify.indexOf(to) === -1) {
      return processed();
    }
    if (verified[field]) {
      return processed();
    }
    if (!o[field] && !options.required) {
      return processed();
    }
    processed(errors.forbidden('\'' + field + '\' needs to be verified before changing the state'));
  }, done);
};

var findModelUpdatesQueueUrl = function (done) {
  if (modelUpdatesQueueUrl) {
    return done(null, modelUpdatesQueueUrl);
  }
  exports.sqs().getQueueUrl({
    QueueName: exports.queue('model-updates') + '.fifo'
  }, function (err, o) {
    if (err) {
      return done(err);
    }
    modelUpdatesQueueUrl = o.QueueUrl;
    done(null, modelUpdatesQueueUrl);
  });
};

var cacheKey = function (key) {
  return 'caches:' + key;
};

exports.model = function (name) {
  var sera = require('../index');
  return sera.model(name);
};

exports.once = once;

exports.none = function () {

};

exports.env = function () {
  return env;
};

exports.domain = function () {
  return nconf.get('DOMAIN');
};

exports.emailDomain = function () {
  return nconf.get('EMAIL_DOMAIN');
};

exports.cache = function (key, value, done) {
  if (!value) {
    exports.redis().del(cacheKey(key));
    return done();
  }
  exports.redis().set(cacheKey(key), value);
  done();
};

exports.cached = function (key, done) {
  exports.redis().get(cacheKey(key), function (err, value) {
    if (err) {
      return done(err);
    }
    done(null, value);
  })
};

exports.subdomain = function () {
  return nconf.get('SUBDOMAIN');
};

exports.adminEmail = function () {
  return 'admin@' + exports.emailDomain();
};

exports.client = function (done) {
  if (client) {
    return done(null, client);
  }
  exports.model('clients').findOne({name: exports.domain()}).exec(function (err, c) {
    if (err) {
      return done(err);
    }
    if (!c) {
      return done('No client with name ' + exports.domain() + ' can be found.');
    }
    client = exports.json(c);
    done(null, c);
  });
};

exports.merge = function (a, b) {
  if (a && b) {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = a[key] || b[key];
      }
    }
  }
  return a;
};

exports.s3 = function () {
  return s3;
};

exports.ses = function () {
  return ses;
};

exports.sqs = function () {
  return sqs;
};

exports.sns = function () {
  return sns;
};

exports.resolve = function (url) {
  var protocol = url.match(/.*?:\/\//g);
  if (!protocol) {
    return url;
  }
  protocol = protocol[0];
  if (protocol === 'https://' || protocol === 'http://') {
    return url;
  }
  var serverUrl = exports.serverUrl();
  var sub = protocol.replace('://', '');
  var suffix = url.substring(protocol.length);
  return format(serverUrl, {
    subdomain: sub
  }) + suffix;
};

exports.bucket = function (name) {
  return nconf.get('S3_BUCKET_' + name.replace(/-/ig, '_').toUpperCase());
};

exports.queue = function (name) {
  return nconf.get('SQS_QUEUE_' + name.replace(/-/ig, '_').toUpperCase());
};

exports.redis = function () {
  if (redis) {
    return redis;
  }
  redis = new Redis(nconf.get('REDIS_URI'));
  return redis;
};

exports.serverUrl = function () {
  if (serverUrl) {
    return serverUrl;
  }
  serverUrl = nconf.get('SERVER_SSL') ? 'https' : 'http';
  serverUrl += '://' + exports.subdomain() + '.' + exports.domain();
  var port = nconf.get('SERVER_PORT') || nconf.get('PORT');
  serverUrl += (port === '80' || port === '443') ? '' : ':' + port;
  return serverUrl;
};

exports.encrypt = function (value, done) {
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) {
      return done(err);
    }
    bcrypt.hash(value, salt, function (err, hash) {
      if (err) {
        return done(err);
      }
      done(null, hash);
    });
  });
};

exports.compare = function (left, right, done) {
  if (!left || !right) {
    return done(null, false);
  }
  bcrypt.compare(left, right, done);
};

exports.findUser = function (email, done) {
  var user = users[email];
  if (user) {
    return done(null, user);
  }
  exports.model('users').findOne({email: email}, function (err, user) {
    if (err) {
      return done(err)
    }
    users[email] = user;
    done(null, user);
  });
};

exports.notify = function (model, id, action, changes, done) {
  var data = {
    id: id,
    action: action,
    updated: changes,
    model: model
  };
  findModelUpdatesQueueUrl(function (err, queueUrl) {
    if (err) {
      return done(err);
    }
    var mid = exports.uuid();
    exports.sqs().sendMessage({
      MessageBody: exports.stringify(data),
      QueueUrl: queueUrl,
      MessageGroupId: mid,
      MessageDeduplicationId: mid
    }, done);
  });
};

exports.findGroup = function (user, name, done) {
  var o = groups[user] || (groups[user] = {});
  var group = o[name];
  if (group) {
    return done(null, group);
  }
  exports.model('groups').findOne({user: user, name: name}, function (err, group) {
    if (err) {
      return done(err)
    }
    o[name] = group;
    done(null, group);
  });
};

exports.findWorkflow = function (user, name, done) {
  var o = workflows[user] || (workflows[user] = {});
  var workflow = o[name];
  if (workflow) {
    return done(null, workflow);
  }
  exports.model('workflows').findOne({user: user, name: name}, function (err, workflow) {
    if (err) {
      return done(err)
    }
    o[name] = workflow;
    done(null, workflow);
  });
};

exports.workflow = function (name, done) {
  exports.findUser(exports.adminEmail(), function (err, user) {
    if (err) {
      return done(err);
    }
    exports.findWorkflow(user, name, done);
  });
};

exports.workflowActions = function (name, done) {
  var actions = ['*', 'read', 'update', 'delete'];
  if (!name) {
    return done(null, actions);
  }
  exports.workflow(name, function (err, workflow) {
    if (err) {
      return done(err);
    }
    if (!workflow) {
      return done(new Error('workflow ' + workflow + ' not found'));
    }
    var transitions = workflow.transitions;
    Object.keys(transitions).forEach(function (status) {
      actions = actions.concat(Object.keys(transitions[status]));
    });
    done(null, actions);
  });
};

exports.group = function (name, done) {
  exports.findUser(exports.adminEmail(), function (err, user) {
    if (err) {
      return done(err);
    }
    exports.findGroup(user, name, done);
  });
};

exports.grouped = function (user, name, done) {
  exports.group(name, function (err, o) {
    if (err) {
      return done(err);
    }
    var entry = _.find(user.groups, function (group) {
      return String(group) === o.id;
    });
    done(null, !!entry);
  });
};

exports.findTier = function (user, name, done) {
  var o = tiers[user] || (tiers[user] = {});
  var tier = o[name];
  if (tier) {
    return done(null, tier);
  }
  exports.model('tiers').findOne({user: user, name: name}, function (err, tier) {
    if (err) {
      return done(err)
    }
    o[name] = tier;
    done(null, tier);
  });
};

exports.tier = function (name, done) {
  exports.findUser(exports.adminEmail(), function (err, user) {
    if (err) {
      return done(err);
    }
    exports.findTier(user.id, name, done);
  });
};

exports.visibles = function (ctx, o, done) {
  if (ctx.previleged) {
    return done(null, o);
  }
  exports.group('anonymous', function (err, anon) {
    if (err) {
      return done(err);
    }
    var restricted = {
      id: o.id
    };
    var user = exports.json(ctx.user);
    var groups = user ? user.groups : [anon.id];
    var visibility = ctx.found ? ctx.found.visibility : o.visibility;
    if (!visibility) {
      return restricted;
    }
    var unbound = visibility['*'] || {};
    var allGroups = unbound.groups || [];
    var all = groups.some(function (group) {
      return allGroups.indexOf(group) !== -1
    });
    if (all) {
      return done(null, o);
    }
    var allUsers = unbound.users || [];
    if (user && allUsers.indexOf(user.id) !== -1) {
      return done(null, o);
    }
    var fields = Object.keys(o);
    fields.forEach(function (field) {
      var allowed = visibility[field];
      if (!allowed) {
        return;
      }
      if (user && allowed.users && allowed.users.indexOf(user.id) !== -1) {
        return restricted[field] = o[field];
      }
      if (!allowed.groups) {
        return;
      }
      var can = groups.some(function (group) {
        return allowed.groups.indexOf(group) !== -1;
      });
      if (can) {
        restricted[field] = o[field];
      }
    });
    done(null, restricted);
  });
};

exports.json = function (o) {
  if (!o) {
    return null;
  }
  try {
    o = JSON.stringify(o);
  } catch (e) {
    log.error('json:stringify', e);
    return null
  }
  return JSON.parse(o);
};

exports.stringify = function (o) {
  return stringify(o);
};

exports.uuid = function () {
  return uuidv4();
};

exports.diff = function (lh, rh) {
  return diff(exports.json(lh), exports.json(rh));
};

exports.origin = function (url) {
  return url.match(/^(?:https?:)?(?:\/\/)?([^\/\?]+)/img)[0];
};

exports.permit = function (o, type, id, actions) {
  actions = Array.isArray(actions) ? actions : [actions];
  var permissions = o.permissions || [];
  var found = permissions.some(function (entry) {
    if (entry[type] !== id) {
      return false;
    }
    var actionz = entry.actions;
    entry.actions = _.union(actionz, actions);
    return true;
  });
  if (found) {
    return o;
  }
  var entry = {
    actions: actions
  };
  entry[type] = id;
  permissions.push(entry);
  return o;
};

exports.permitted = function (user, o, action) {
  var groups = user.groups;
  var permissions = o.permissions || [];
  var allowed = {
    groups: [],
    users: []
  };
  permissions.forEach(function (perm) {
    var actions = perm.actions || [];
    if (actions.indexOf(action) === -1 && actions.indexOf('*') === -1) {
      return;
    }
    if (perm.group) {
      return allowed.groups.push(perm.group);
    }
    if (perm.user) {
      return allowed.users.push(perm.user);
    }
  });
  if (allowed.users.indexOf(user.id) !== -1) {
    return true;
  }
  var i;
  var group;
  var length = groups.length;
  for (i = 0; i < length; i++) {
    group = groups[i];
    if (allowed.groups.indexOf(group) !== -1) {
      return true;
    }
  }
  return false;
};

exports.deny = function (o, type, id, actions) {
  actions = Array.isArray(actions) ? actions : [actions];
  var permissions = o.permissions || [];
  permissions.some(function (entry) {
    if (entry[type] !== id) {
      return false;
    }
    var actionz = entry.actions;
    entry.actions = _.difference(actionz, actions);
    return true;
  });
  return o;
};

exports.visible = function (o, type, id, fields) {
  fields = Array.isArray(fields) ? fields : [fields];
  fields.forEach(function (field) {
    var visibility = o.visibility || {};
    var entry = visibility[field] || (visibility[field] = {});
    var values = entry[type] || (entry[type] = []);
    entry[type] = _.union(values, [id]);
  });
  return o;
};

exports.invisible = function (o, type, id, fields) {
  fields = Array.isArray(fields) ? fields : [fields];
  fields.forEach(function (field) {
    var visibility = o.visibility;
    if (!visibility) {
      return;
    }
    var entry = visibility[field];
    if (!entry) {
      return;
    }
    var values = entry[type];
    if (!values) {
      return;
    }
    entry[type] = _.difference(values, [id]);
  });
  return o;
};

exports.toPermissions = function (user, workflow, status, o, done) {
  var permissions = [];
  var permit = workflow.permits[status];
  var groups = permit.groups;
  var model = permit.model || {};
  Object.keys(model).forEach(function (field) {
    var value = o[field];
    if (!value) {
      return;
    }
    var p = model[field];
    if (p.group) {
      permissions.push({
        group: value,
        actions: p.group.actions
      });
      return;
    }
    if (p.user) {
      permissions.push({
        user: value,
        actions: p.user.actions
      });
      return;
    }
  });
  async.each(Object.keys(groups), function (name, eachLimit) {
    var actions = groups[name].actions;
    exports.group(name, function (err, group) {
      if (err) {
        return eachLimit(err);
      }
      permissions.push({
        group: group.id,
        actions: actions
      });
      eachLimit();
    });
  }, function (err) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, permissions);
    }
    permissions.push({
      user: user,
      actions: permit.user.actions
    });
    done(null, permissions);
  });
};

exports.toVisibility = function (user, workflow, status, o, done) {
  var visibility = {};
  var permit = workflow.permits[status];

  var add = function (type, id, fields) {
    fields.forEach(function (field) {
      var entry = visibility[field] || (visibility[field] = {
        users: [],
        groups: []
      });
      entry[type].push(id);
    });
  };

  var model = permit.model || {};
  Object.keys(model).forEach(function (field) {
    var value = o[field];
    if (!value) {
      return;
    }
    var p = model[field];
    if (p.group) {
      return add('groups', value, p.group.visibility);
    }
    if (p.user) {
      return add('users', value, p.user.visibility);
    }
  });

  var overrides = o._ && o._.visibility && o._.visibility[status];

  var filter = function (group, visibles) {
    if (group.name === 'admin') {
      return visibles;
    }
    if (!overrides) {
      return visibles;
    }
    var overridden = overrides[group.id];
    if (!overridden) {
      return [];
    }
    var index = {};
    visibles.forEach(function (field) {
      index[field] = true;
    });
    var allowed = [];
    overridden.forEach(function (field) {
      if (index[field] || index['*']) {
        allowed.push(field);
      }
    });
    return allowed;
  };

  var groups = permit.groups;
  async.each(Object.keys(groups), function (name, eachLimit) {
    var visibles = groups[name].visibility;
    exports.group(name, function (err, group) {
      if (err) {
        return eachLimit(err);
      }
      add('groups', group.id, filter(group, visibles));
      eachLimit();
    });
  }, function (err) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, visibility);
    }
    add('users', user, permit.user.visibility);
    done(null, visibility);
  });
};

exports.transit = function (o, done) {
  var id = o.id;
  var action = o.action;
  var user = o.user;
  var model = o.model;
  var workflow = o.workflow;

  var allowed = function (it, from, to, next) {
    if (!model.transitable) {
      return transitable(model, it, from, to, next);
    }
    model.transitable(it, from, to, function (err, allowed) {
      if (err) {
        return next(err);
      }
      if (!allowed) {
        return next(errors.forbidden());
      }
      transitable(model, it, from, to, next);
    });
  };

  model.findOne({_id: id}, function (err, it) {
    if (err) {
      return done(err);
    }
    if (!it) {
      return done(errors.notFound());
    }
    var from = it.status;
    if (!from) {
      return done(errors.unauthorized());
    }
    var found = exports.json(it);
    if (!exports.permitted(exports.json(user), found, action)) {
      return done(errors.unauthorized())
    }
    exports.workflow(workflow, function (err, workflow) {
      if (err) {
        return done(err);
      }
      if (!workflow) {
        return done(new Error('!workflow'));
      }
      var transitions = workflow.transitions;
      var actions = transitions[from];
      if (!actions) {
        return done(errors.unauthorized());
      }
      var to = actions[action];
      if (!to) {
        return done(errors.unauthorized());
      }
      allowed(it, from, to, function (err) {
        if (err) {
          return done(err);
        }
        var usr = found ? found.user : user.id;
        exports.toPermissions(usr, workflow, to, found, function (err, permissions) {
          if (err) {
            return done(err);
          }
          exports.toVisibility(usr, workflow, to, found, function (err, visibility) {
            if (err) {
              return done(err);
            }
            model.findOneAndUpdate({_id: id}, {
              status: to,
              permissions: permissions,
              visibility: visibility
            }, done);
          });
        });
      });
    });
  });
};

exports.delayed = function () {
  var args = Array.prototype.slice.call(arguments);
  var delay = args.shift();
  var done = args.shift();
  setTimeout(function () {
    done.apply(null, args);
  }, delay);
};

exports.objectId = function (id) {
  return id && id.match(/^[0-9a-fA-F]{24}$/);
};

exports.ensureIndexes = function (schema, compounds, o) {
  var paths = schema.paths;
  Object.keys(paths).forEach(function (path) {
    var oo = paths[path];
    var options = oo.options || {};
    if (!options.searchable && !options.sortable) {
      return;
    }
    var index = {};
    index[path] = 1;
    if (!options.sortable) {
      schema.index(index);
      return;
    }
    index._id = 1;
    compounds.push(index);
    schema.index(index);
  });
  var extended = [];
  compounds.forEach(function (oo) {
    schema.index(oo, o);
    var exd = _.cloneDeep(oo);
    exd[Object.keys(exd)[0]] = -1;
    schema.index(exd, o);
    extended.push(exd);
  });
  schema.compounds = compounds.concat(extended);
};

exports.cast = function (model, data) {
  var schema = model.schema;
  var paths = schema.paths;
  var field;
  var options;
  var type;
  for (field in data) {
    if (!data.hasOwnProperty(field)) {
      continue;
    }
    options = paths[field].options;
    type = options.type;
    if (field === '_id') {
      data[field] = new ObjectId(data[field]);
      continue
    }
    data[field] = new type(data[field]);
  }
  return data;
};

exports.invert = function (o) {
  var key;
  var clone = _.cloneDeep(o);
  for (key in clone) {
    if (!clone.hasOwnProperty(key)) {
      continue;
    }
    clone[key] *= -1;
  }
  return clone;
};

exports.first = function (o) {
  var key;
  for (key in o) {
    if (!o.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};

exports.cursor = function (index, o) {
  var field;
  var cursor = {};
  for (field in index) {
    if (!index.hasOwnProperty(field)) {
      continue;
    }
    cursor[field] = o[field];
  }
  return cursor;
};
