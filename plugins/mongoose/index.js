var log = require('logger')('mongutils');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var validators = require('../../validators');

var types = validators.types;
var values = validators.values;
var queries = validators.queries;
var hybrids = validators.hybrids;

module.exports = function (o) {
  o = o || {};
  return function (schema, options) {
    schema.virtual('id').get(function () {
      return String(this._id);
    });

    schema.set('toJSON', {
      getters: true,
      transform: function (doc, ret, options) {
        delete ret._id;
        delete ret.__v;
        if (o.transform) {
          o.transform(ret);
        }
      }
    });
  };
};

module.exports.permissions = function (o) {
  o = o || {};
  o.actions = ['read', 'update', 'delete'];
  o.server = !!o.workflow;
  return function (schema, options) {
    schema.add({
      permissions: {
        type: [{
          _id: false,
          user: Schema.Types.ObjectId,
          group: Schema.Types.ObjectId,
          actions: [String]
        }],
        required: true,
        after: 'status',
        hybrid: hybrids.permissions(o),
        searchable: true,
        validator: types.permissions(o),
        value: values.permissions(o)
      }
    });
  };
};

module.exports.user = function (o) {
  o = o || {};
  return function (schema, options) {
    schema.add({
      user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        validator: types.ref(),
        server: true,
        required: !o.optional,
        searchable: true,
        value: values.user()
      }
    });
  };
};

module.exports.createdAt = function (o) {
  o = o || {};
  return function (schema, options) {
    schema.add({
      createdAt: {
        type: Date,
        required: true,
        default: Date.now,
        validator: types.date(),
        server: true,
        value: values.createdAt()
      }
    });
  };
};

module.exports.updatedAt = function (o) {
  o = o || {};
  return function (schema, options) {
    var oo = {
      type: Date,
      required: true,
      default: Date.now,
      validator: types.date(),
      server: true,
      searchable: true,
      sortable: true,
      value: values.updatedAt()
    };
    if (o.expires) {
      oo.expires = o.expires;
    }
    schema.add({
      updatedAt: oo
    });
  };
};

module.exports.status = function (o) {
  o = o || {};
  return function (schema, options) {
    schema.add({
      status: {
        type: String,
        required: true,
        searchable: true,
        server: true,
        value: values.status(o),
        validator: types.status(o)
      }
    });
  };
};

module.exports._ = function (o) {
  o = o || {};
  return function (schema, options) {
    schema.add({
      _: {
        type: Object,
        required: true,
        hybrid: hybrids._(o),
        validator: types._(o),
        value: values._()
      }
    });
  };
};

module.exports.visibility = function (o) {
  o = o || {};
  return function (schema, options) {
    schema.add({
      visibility: {
        type: Object,
        required: true,
        hybrid: hybrids.visibility(o),
        validator: types.visibility(o),
        value: values.visibility(o)
      }
    });
  };
};

module.exports.modifiedAt = function (o) {
  o = o || {};
  return function (schema, options) {
    var oo = {
      type: Date,
      required: true,
      default: Date.now,
      validator: types.date(),
      server: true,
      searchable: true,
      sortable: true
    };
    if (o.expires) {
      oo.expires = o.expires;
    }
    schema.add({
      modifiedAt: oo
    });
    schema.pre('validate', function (next) {
      this.modifiedAt = new Date();
      next();
    });
    schema.pre('update', function (next) {
      this.modifiedAt = new Date();
      next();
    });
  };
};

module.exports.tags = function (o) {
  var value = {};
  var validator = {};
  var fields = Object.keys(o);
  fields.forEach(function (field) {
    var tagger = o[field];
    value[field] = tagger.value;
    validator[field] = tagger.validator;
  });
  return function (schema, options) {
    schema.add({
      tags: {
        type: [{
          _id: false,
          name: String,
          value: String
        }],
        default: [],
        server: true,
        searchable: true,
        validator: types.tags(validator),
        value: values.tags(value),
        query: queries.array({
          allowed: ['name', 'value']
        })
      }
    });
  };
};
