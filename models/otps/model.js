var log = require('logger')('model-otps');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var plugins = require('../../plugins');
var validators = require('../../validators');

var types = validators.types;
var values = validators.values;

var TOKEN_LENGTH = 48;
var TOKEN_SIZE = 2 * TOKEN_LENGTH;

var WEAK_TOKEN_LENGTH = 3;
var WEAK_TOKEN_SIZE = 2 * WEAK_TOKEN_LENGTH;

var schema = Schema({
  name: {
    type: String,
    required: true,
    index: true,
    validator: types.string({
      length: 50
    })
  },
  for: {
    type: String,
    server: true,
    index: true,
    validator: types.string({
      length: 200
    })
  },
  weak: {
    type: String,
    required: true,
    server: true,
    index: true,
    validator: types.string({
      length: WEAK_TOKEN_SIZE
    }),
    value: values.random({size: WEAK_TOKEN_LENGTH})
  },
  strong: {
    type: String,
    required: true,
    server: true,
    index: true,
    validator: types.string({
      length: TOKEN_SIZE
    }),
    value: values.random({size: TOKEN_LENGTH})
  }
}, {collection: 'otps'});

schema.plugin(plugins());
schema.plugin(plugins.user());
schema.plugin(plugins._());
schema.plugin(plugins.permissions());
schema.plugin(plugins.visibility());
schema.plugin(plugins.createdAt());
schema.plugin(plugins.updatedAt());
schema.plugin(plugins.modifiedAt({expires: 600}));

module.exports = mongoose.model('otps', schema);
