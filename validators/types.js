var util = require('util');
var fs = require('fs');
var mongoose = require('mongoose');
var async = require('async');
var _ = require('lodash');

var errors = require('errors');

var queries = require('./queries');

var utils = require('../utils');
var commons = require('./commons');

var format = function () {
  return util.format.apply(util.format, Array.prototype.slice.call(arguments));
};

var unprocessableEntity = function () {
  var message = format.apply(format, Array.prototype.slice.call(arguments));
  return errors.unprocessableEntity(message);
};

exports.stream = function (options) {
  options = options || {};
  return function (o, done) {
    var value = o.value;
    var field = options.field || o.field;
    if (!value) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    fs.exists(value.path, function (exists) {
      if (!exists) {
        return done(unprocessableEntity('\'%s\' needs to be a stream', field));
      }
      done(null, value);
    });
  };
};

exports.binary = function (options) {
  options = options || {};
  return function (o, done) {
    var value = o.value;
    var stream = o.stream && o.stream[0];
    var path = o.path;
    var required = path.isRequired;
    var field = options.field || o.field;
    if (stream && value) {
      return done(unprocessableEntity('\'%s\' contains multiple values', field));
    }
    if (required && !(stream || value)) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    var validateData = function (done) {
      var validator = exports.string({
        field: field
      });
      var value = o.value;
      validator({
        user: o.user,
        path: path,
        field: field,
        value: value,
        options: {}
      }, done);
    };
    var validateStream = function (done) {
      var validator = exports.stream({
        field: field
      });
      validator({
        user: o.user,
        path: path,
        field: field,
        value: stream,
        options: {}
      }, done);
    };
    if (!value) {
      return validateStream(done);
    }
    if (!stream) {
      return validateData(done);
    }
    validateStream(function (err) {
      if (err) {
        return done(err);
      }
      validateData(done);
    });
  };
};

exports.binaries = function (options) {
  options = options || {};
  return function (o, done) {
    var value = o.value;
    var stream = o.stream;
    var path = o.path;
    var required = path.isRequired;
    var field = options.field || o.field;
    var max = options.max || 1;
    var min = options.min || (required ? 1 : 0);
    var validateData = function (min, done) {
      var validator = exports.array({
        max: max,
        min: min,
        validator: exports.string({
          field: field
        })
      });
      var value = o.value;
      validator({
        user: o.user,
        path: path,
        field: field,
        value: value,
        options: {}
      }, done);
    };
    var validateStream = function (min, done) {
      var validator = exports.array({
        max: max,
        min: min,
        validator: exports.stream({
          field: field
        })
      });
      validator({
        user: o.user,
        path: path,
        field: field,
        value: stream,
        options: {}
      }, done);
    };
    if (!value) {
      return validateStream(min, done);
    }
    if (!stream) {
      return validateData(min, done);
    }
    validateStream(0, function (err) {
      if (err) {
        return done(err);
      }
      validateData(0, function (err) {
        if (err) {
          return done(err);
        }
        var length = value.length + stream.length;
        if (max < length) {
          return done(unprocessableEntity('\'%s\' exceeds the allowed length', field));
        }
        if (min > length) {
          return done(unprocessableEntity('\'%s\' needs to contain more values', field));
        }
        done(null, value);
      });
    });
  };
};

exports.array = function (options) {
  options = options || {};
  return function (o, done) {
    var array = o.value;
    var field = options.field || o.field;
    var max = o.options.max || options.max || 10;
    var min = o.options.min || options.min || 0;
    if (!array) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    if (!Array.isArray(array)) {
      return done(unprocessableEntity('\'%s\' needs to be an array', field));
    }
    if (max < array.length) {
      return done(unprocessableEntity('\'%s\' exceeds the allowed length', field));
    }
    if (min > array.length) {
      return done(unprocessableEntity('\'%s\' needs to contain more values', field));
    }
    async.each(array, function (v, validated) {
      options.validator({
        user: o.user,
        path: o.path,
        field: field + '[*]',
        value: v,
        options: o.options
      }, validated)
    }, function (err) {
      done(err, array);
    });
  };
};

exports.groups = function (options) {
  options = options || {};
  return function (o, done) {
    var groups = o.value;
    var field = options.field || o.field;
    var max = o.options.max || options.max || 10;
    var min = o.options.min || options.min || 0;
    if (!groups) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    if (!Array.isArray(groups)) {
      return done(unprocessableEntity('\'%s\' needs to be an array', field));
    }
    if (max < groups.length) {
      return done(unprocessableEntity('\'%s\' exceeds the allowed length', field));
    }
    if (min > groups.length) {
      return done(unprocessableEntity('\'%s\' needs to contain more values', field));
    }
    if (o.query) {
      return done(null, groups);
    }
    async.each(groups, function (v, validated) {
      var validator = exports.ref();
      validator({
        user: o.user,
        path: o.path,
        field: field + '[*]',
        value: v,
        options: o.options
      }, validated);
    }, function (err) {
      if (err) {
        return done(err);
      }
      var Groups = mongoose.model('groups');
      var query = {_id: {$in: groups}};
      commons.permitOnly({user: o.user}, query, {$in: ['*', 'read']}, function (err) {
        if (err) {
          return done(err);
        }
        Groups.find(query).select('_id').exec(function (err, groupz) {
          if (err) {
            return done(err);
          }
          if (!groupz || (groups.length !== groupz.length)) {
            return done(unprocessableEntity('\'%s\' contains an invalid value', field));
          }
          done(null, groups);
        });
      });
    });
  };
};

exports.ref = function (options) {
  options = options || {};
  return function (o, done) {
    var ref = o.value;
    var field = options.field || o.field;
    if (!mongoose.Types.ObjectId.isValid(ref)) {
      return done(unprocessableEntity('\'%s\' needs to be a valid reference', field));
    }
    done(null, ref);
  };
};

exports.boolean = function (options) {
  options = options || {};
  return function (o, done) {
    var boolean = o.value;
    var field = options.field || o.field;
    if (!boolean) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    if (typeof boolean !== 'boolean' && !(boolean instanceof Boolean)) {
      return done(unprocessableEntity('\'%s\' needs to be a boolean', field));
    }
    done(null, boolean);
  };
};

exports.url = function (options) {
  options = options || {};
  return function (o, done) {
    var url = o.value;
    var field = options.field || o.field;
    if (!url || url.length > 2000 || (url.indexOf('http://') === -1 && url.indexOf('https://') === -1)) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', field));
    }
    done(null, url);
  };
};

exports.cors = function (options) {
  options = options || {
    url: exports.url(options)
  };
  return function (o, done) {
    var urls = o.value;
    var field = options.field || o.field;
    async.each(urls, function (url, eachDone) {
      if (url === '*') {
        return eachDone();
      }
      options.url({
        value: url,
        field: field
      }, eachDone);
    }, function (err) {
      done(err, urls);
    });
  };
};

var binaryTypes = [
  'image'
];

exports.binaryType = function (options) {
  options = options || {};
  return function (o, done) {
    var media = o.value;
    var field = options.field || o.field;
    if (!media) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    if (binaryTypes.indexOf(media) === -1) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', field));
    }
    done(null, media);
  };
};

exports.username = function (options) {
  options = options || {};
  return function (o, done) {
    return exports.string(options)(o, function (err) {
      if (err) {
        return done(err);
      }
      var value = o.value;
      var field = options.field || o.field;
      var regex = '^([a-z0-9]{1}[a-z0-9\\-]{0,' + (options.length - 2) + '}[a-z0-9]{1}|[a-z0-9]){1}$';
      if (/^.*(-)\1{1,}.*$/.test(value) || !RegExp(regex).test(value)) {
        return done(unprocessableEntity('\'%s\' contains an invalid value', field));
      }
      done(null, value);
    });
  };
};

exports.name = function (options) {
  options = options || {};
  return exports.string(options);
};

exports.json = function (options) {
  options = options || {};
  return function (o, done) {
    var json = o.value;
    var field = options.field || o.field;
    if (!json) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    json = JSON.stringify(json);
    if (json.length > options.length) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', field));
    }
    done(null, json);
  };
};

exports.title = function (options) {
  options = options || {};
  return function (o, done) {
    done(null, o.value);
  };
};

exports.color = function (options) {
  options = options || {};
  return function (o, done) {
    done(null, o.value);
  };
};

exports.currency = function (options) {
  options = options || {};
  return function (o, done) {
    done(null, o.value);
  };
};

exports.contacts = function (options) {
  options = options || {};
  return function (o, done) {
    var contacts = o.value;
    var field = options.field || o.field;
    if (!contacts) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    var diff = _.difference(Object.keys(contacts), [
      'email',
      'phones',
      'messenger',
      'skype',
      'viber',
      'whatsapp'
    ]);
    if (diff.length) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', field));
    }
    var validate = function (field, validator, done) {
      var val = contacts[field];
      if (!val) {
        return done();
      }
      validator({
        field: field,
        value: val
      }, done);
    };
    var validatePhones = function (phones, done) {
      if (!phones) {
        return done();
      }
      if (!Array.isArray(phones)) {
        return done(unprocessableEntity('\'%s.phones\' contains an invalid value', field));
      }
      async.each(phones, function (phone, eachDone) {
        if (!phone) {
          return eachDone(unprocessableEntity('\'%s.phones\' contains an invalid value', field));
        }
        exports.phone()({
          field: 'phones',
          value: phone
        }, eachDone);
      }, done);
    };
    var validatePhone = function (phone, done) {
      if (!phone) {
        return done();
      }
      validatePhones([phone], done);
    };
    validate('email', exports.email(), function (err) {
      if (err) {
        return done(unprocessableEntity('\'%s.email\' contains an invalid value', field));
      }
      validatePhones(contacts.phones, function (err) {
        if (err) {
          return done(unprocessableEntity('\'%s.phones\' contains an invalid value', field));
        }
        validate('messenger', exports.string({length: 50}), function (err) {
          if (err) {
            return done(unprocessableEntity('\'%s.messenger\' contains an invalid value', field));
          }
          validate('skype', exports.string({length: 50}), function (err) {
            if (err) {
              return done(unprocessableEntity('\'%s.skype\' contains an invalid value', field));
            }
            validatePhone(contacts.viber, function (err) {
              if (err) {
                return done(unprocessableEntity('\'%s.viber\' contains an invalid value', field));
              }
              validatePhone(contacts.whatsapp, function (err) {
                if (err) {
                  return done(unprocessableEntity('\'%s.whatsapp\' contains an invalid value', field));
                }
                done(null, contacts);
              });
            });
          });
        });
      });
    });
  };
};

exports.date = function (options) {
  options = options || {};
  return function (o, done) {
    var date = o.value;
    var field = options.field || o.field;
    if (!date) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    if (date instanceof Date) {
      return done(null, date);
    }
    var at;
    var type = typeof date;
    if (type === 'number' || date instanceof Number) {
      at = new Date(date);
    } else if (type === 'string' || date instanceof String) {
      at = Date.parse(date);
    }
    if (!at) {
      return done(unprocessableEntity('\'%s\' needs to be a valid date', field));
    }
    done(null, date);
  };
};

exports.email = function (options) {
  options = options || {};
  return function (o, done) {
    var email = o.value;
    var field = options.field || o.field;
    if (!email) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    var at = email.indexOf('@');
    var dot = email.lastIndexOf('.');
    if (at === -1 || dot === -1 || dot < at) {
      return done(unprocessableEntity('\'%s\' needs to be a valid email address', field));
    }
    done(null, email);
  };
};

exports.phone = function (options) {
  options = options || {};
  return function (o, done) {
    var phone = o.value;
    var field = options.field || o.field;
    if (!phone) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
      return done(unprocessableEntity('\'%s\' needs to be a valid phone number', field));
    }
    done(null, phone);
  };
};

exports.password = function (options) {
  options = options || {};

  var block = function (o, done) {
    if (!options.block) {
      return done(null, {});
    }
    options.block(o, done);
  };

  return function (o, done) {
    block(o, function (err, blocked) {
      if (err) {
        return done(err);
      }

      var password = o.value;
      var field = options.field || o.field;
      if (!password) {
        return done(unprocessableEntity('\'%s\' needs to be specified', field));
      }
      if (password.length < 6) {
        return done(unprocessableEntity('\'%s\' should at least be 6 characters', field));
      }
      var pass = password.toLowerCase();
      var name;
      for (name in blocked) {
        if (!blocked.hasOwnProperty(name)) {
          continue;
        }
        if (pass !== blocked[name].toLowerCase()) {
          continue;
        }
        return done(unprocessableEntity('\'%s\' should not be equivalent to the \'%s\'', field, name));
      }
      if (!/[0-9]/.test(password)) {
        return done(unprocessableEntity('\'%s\' should contain at least one number', field));
      }
      if (!/[a-z]/.test(password)) {
        return done(unprocessableEntity('\'%s\' should contain at one lower case letter', field));
      }
      if (!/[A-Z]/.test(password)) {
        return done(unprocessableEntity('\'%s\' should contain at one upper case letter', field));
      }
      if (!/[`~!@#$%^&*()\-_=+[{\]}\\|;:'",<.>/?\s]/.test(password)) {
        return done(unprocessableEntity('\'%s\' should contain at one special character', field));
      }
      done(null, password);
    });
  };
};

exports.birthday = function (options) {
  options = options || {};
  return function (o, done) {
    done(null, o.value);
  };
};

exports.addresses = function (options) {
  options = options || {};
  return function (o, done) {
    done(null, o.value);
  };
};

exports.phones = function (options) {
  options = options || {};
  return function (o, done) {
    var phones = o.value;
    async.each(phones, function (phone, validated) {
      exports.phone({
        field: (options.field || o.field) + '[*]'
      })({value: phone}, validated);
    }, function (err) {
      done(err, phones);
    });
  };
};

exports.socials = function (options) {
  options = options || {};
  return function (o, done) {
    done(null, o.value);
  };
};

exports.country = function (options) {
  options = options || {};
  return function (o, done) {
    var country = o.value;
    var field = options.field || o.field;
    if (!country) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    var allow = options.allow;
    if (allow.indexOf(country) === -1) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', field))
    }
    done(null, country);
  };
};

exports.status = function (options) {
  options = options || {};
  return function (o, done) {
    var field = options.field || o.field;
    var status = o.value;
    if (!status) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    utils.workflow(options.workflow, function (err, workflow) {
      if (err) {
        return done(err);
      }
      if (!workflow) {
        return done(new Error('!workflow'));
      }
      var transitions = workflow.transitions;
      if (!transitions[status]) {
        return done(unprocessableEntity('\'%s\' contains an invalid value', field));
      }
      done(null, status);
    });
  };
};

exports.permissions = function (options) {
  options = options || {};
  return function (o, done) {
    var field = options.field || o.field;
    var permissions = o.value;
    if (!permissions) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    var user = o.user;
    utils.workflowActions(options.workflow, function (err, actions) {
      if (err) {
        return done(err);
      }
      var i;
      var entry;
      var id = o.id;
      var length = permissions.length;
      var found = false;
      for (i = 0; i < length; i++) {
        entry = permissions[i];
        if (!(entry.user || entry.group)) {
          return done(unprocessableEntity('either \'%s[*].user\' or \'%s[*].group\' needs to be specified', field, field));
        }
        if (!Array.isArray(entry.actions)) {
          return done(unprocessableEntity('\'%s\' needs to be an array', field + '.actions'));
        }
        var valid = entry.actions.every(function (action) {
          return actions.indexOf(action) !== -1;
        });
        if (!valid) {
          return done(unprocessableEntity('\'%s\' contains an invalid value', field + '.actions'));
        }
        if (!id) {
          continue;
        }
        if (!user || user.id !== entry.user) {
          continue;
        }
        if (!permissions.indexOf('read') || !permissions.indexOf('update')) {
          return done(unprocessableEntity('\'%s\' needs to contain permissions for the current user', field));
        }
        found = true;
      }
      if (id && !found) {
        return done(unprocessableEntity('\'%s\' needs to contain permissions for the current user', field));
      }
      done(null, permissions);
    });
  };
};

exports.visibility = function (options) {
  options = options || {};
  return function (o, done) {
    var field = options.field || o.field;
    var visibility = o.value;
    if (!visibility) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    var model = o.model;
    var schema = model.schema;
    var paths = schema.paths;
    Object.keys(visibility).every(function (vfield) {
      if (vfield !== '*' && !paths[vfield]) {
        return done(unprocessableEntity('\'%s\' contains an invalid value', field));
      }
      var entry = visibility[vfield];
      if (typeof entry !== 'object') {
        return done(unprocessableEntity('\'%s.%s\' contains an invalid value', field, vfield));
      }
      Object.keys(entry).every(function (entryKey) {
        if (entryKey !== 'users' && entryKey !== 'groups') {
          return done(unprocessableEntity('\'%s.%s\' contains an invalid value', field, vfield));
        }
        var ids = entry[entryKey];
        if (!Array.isArray(ids)) {
          return done(unprocessableEntity('\'%s.%s.%s\' contains an invalid value', field, vfield, entryKey));
        }
        ids.every(function (id, i) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            return done(unprocessableEntity('\'%s.%s.%s[%s]\' contains an invalid value', field, vfield, entryKey, i));
          }
        });
      });
    });
    done(null, visibility);
  };
};

exports._ = function (options) {
  options = options || {};
  return function (o, done) {
    var value = o.value;
    if (!value) {
      return done();
    }
    var visibility = value.visibility;
    if (!visibility) {
      return done(null, value);
    }
    utils.workflow(options.workflow, function (err, workflow) {
      if (err) {
        return done(err);
      }
      if (!workflow) {
        return done(new Error('!workflow'));
      }
      utils.group('admin', function (err, admin) {
        if (err) {
          return done(err);
        }
        var i;
        var id;
        var ids;
        var status;
        var fields;
        var length;
        var index = {};
        var schema = o.model.schema;
        var paths = Object.keys(schema.paths);
        var permits = workflow.permits;
        paths.forEach(function (path) {
          index[path] = true;
        });
        var field = options.field || o.field;
        for (status in visibility) {
          if (!visibility.hasOwnProperty(status)) {
            continue;
          }
          if (!permits[status]) {
            return done(unprocessableEntity('\'%s\' contains an invalid value', field + '.visibility'));
          }
          ids = visibility[status];
          for (id in ids) {
            if (!ids.hasOwnProperty(id)) {
              continue;
            }
            if (!mongoose.Types.ObjectId.isValid(id)) {
              return done(unprocessableEntity('\'%s\' contains an invalid value', field + '.visibility'));
            }
            if (admin.id === id) {
              return done(unprocessableEntity('\'%s\' contains an invalid value', field + '.visibility'));
            }
            fields = ids[id];
            length = fields.length;
            for (i = 0; i < length; i++) {
              if (!index[fields[i]]) {
                return done(unprocessableEntity('\'%s\' contains an invalid value', field + '.visibility'))
              }
            }
          }
        }
        done(null, value);
      });
    });
  };
};

/*
  {name: 'postal', value: '10230', server: true, group: 'location'}
  schema.plugin(plugins.tags({
    server: {
        location: Locations.tagger,
        contact: Contacts.tagger
    },
    client: {
        enums: ['realestates', 'vehicles', 'phones', 'televisions'],
        validator: function (tags) {

        },
        value: function (tags, done) {
            done(null, tags);
        }
    }
}));
 */
exports.tags = function (options) {
  options = options || {};

  var validateClientTags = function (o, tags, done) {
    if (!tags.length) {
      return done();
    }

    if (!options.client) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.client'));
    }

    var validator = options.client.validator;
    if (!validator) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.client'));
    }

    validator(o, tags, done);
  };

  var validateServerTags = function (o, tags, done) {
    if (!tags.length) {
      return done();
    }

    if (!options.server) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.server'));
    }

    var tagsByGroup = _.groupBy(tags, 'group');

    async.each(Object.keys(tagsByGroup), function (group, groupDone) {
      var tags = tagsByGroup[group];
      var tagger = options.server[group];

      if (!tagger || !tagger.validator) {
        return groupDone(unprocessableEntity('\'%s\' contains an invalid value', o.field));
      }

      tagger.validator(o, tags, groupDone);
    }, done);
  };

  var validateTypeField = function (type, tag) {
    if (tag[type] === 'true' || tag[type] === true) {
      tag[type] = Boolean(tag[type]);
      return true;
    }
    return false;
  }

  var validateTags = queries.array({
    allowed: ['name', 'value', 'server', 'client', 'group']
  });

  var validateClientTagsQuery = function (o, done) {
    var tags = o.value;
    if (!Array.isArray(tags)) {
      return unprocessableEntity('\'%s\' contains an invalid value', o.field);
    }
    var i;
    var tag;
    var length = tags.length;
    for (i = 0; i < length; i++) {
      tag = tags[i];
      if (tag.server) {
        if (validateTypeField('server', tag)) {
          continue;
        }
        return unprocessableEntity('\'%s\' contains an invalid value', o.field);
      }
      if (tag.client) {
        if (validateTypeField('client', tag)) {
          continue;
        }
        return unprocessableEntity('\'%s\' contains an invalid value', o.field);
      }
      if (tag.group && !_.isString(tag.group)) {
        return unprocessableEntity('\'%s\' contains an invalid value', o.field);
      }
      if (tag.name && !_.isString(tag.name)) {
        return unprocessableEntity('\'%s\' contains an invalid value', o.field);
      }
      if (tag.value && !_.isString(tag.value)) {
        return unprocessableEntity('\'%s\' contains an invalid value', o.field);
      }
    }
    return validateTags(o, done);
  };

  return function (o, done) {
    if (o.query) {
      return validateClientTagsQuery(o, done);
    }
    var i;
    var tag;
    var name;
    var tags = o.value;

    var clientTags = [];
    var serverTags = [];
    var otherTags = [];

    tags.forEach(function (tag) {
      if (tag.client) {
        return clientTags.push(tag);
      }
      if (tag.server) {
        return serverTags.push(tag);
      }
      otherTags.push(tag);
    });

    if (otherTags.length) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', o.field));
    }

    var length = tags.length;
    for (i = 0; i < length; i++) {
      tag = tags[i];
      name = tag.name;

      if (tag.server && !_.isBoolean(tag.server)) {
        return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.server'));
      }

      if (tag.client && !_.isBoolean(tag.client)) {
        return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.client'));
      }

      if (!tag.group) {
        return done(unprocessableEntity('\'%s\' needs to be specified', o.field + '.group'));
      }

      if (!_.isString(tag.group)) {
        return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.group'));
      }

      if (!tag.name) {
        return done(unprocessableEntity('\'%s\' needs to be specified', o.field + '.name'));
      }

      if (!_.isString(tag.name)) {
        return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.name'));
      }

      if (!tag.value) {
        return done(unprocessableEntity('\'%s\' needs to be specified', o.field + '.value'));
      }

      if (!_.isString(tag.value)) {
        return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.value'));
      }
    }

    validateClientTags(o, clientTags, function (err) {
      if (err) {
        return done(err);
      }

      validateServerTags(o, serverTags, function (err) {
        if (err) {
          return done(err);
        }

        done(null, tags);
      });
    });
  };
};

exports.string = function (options) {
  options = options || {};
  return function (o, done) {
    var string = o.value;
    var field = options.field || o.field;
    if (!string) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    if (typeof string !== 'string' && !(string instanceof String)) {
      return done(unprocessableEntity('\'%s\' needs to be a string', field));
    }
    if (options.enum) {
      if (options.enum.indexOf(string) !== -1) {
        return done(null, string);
      }
      return done(unprocessableEntity('\'%s\' contains an invalid value', field));
    }
    if (string.length > options.length) {
      return done(unprocessableEntity('\'%s\' exceeds the allowed length', field));
    }
    done(null, string);
  };
};

exports.number = function (options) {
  options = options || {};
  return function (o, done) {
    var number = o.value;
    var field = options.field || o.field;
    if (!number && number !== 0) {
      return done(unprocessableEntity('\'%s\' needs to be specified', field));
    }
    if (typeof number !== 'number' && !(number instanceof Number)) {
      return done(unprocessableEntity('\'%s\' needs to be a number', field));
    }
    if (options.integer && !Number.isInteger(number)) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', field));
    }
    if (options.enum) {
      if (options.enum.indexOf(number) !== -1) {
        return done(null, number);
      }
      return done(unprocessableEntity('\'%s\' contains an invalid value', field));
    }
    if (options.max && number > options.max) {
      return done(unprocessableEntity('\'%s\' needs to be below or equal %s', field, options.max))
    }
    if (options.min && number < options.min) {
      return done(unprocessableEntity('\'%s\' needs to be above or equal %s', field, options.min))
    }
    done(null, number);
  };
};
