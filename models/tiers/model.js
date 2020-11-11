var log = require('logger')('model-tiers');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var plugins = require('../../plugins');
var validators = require('../../validators');

var types = validators.types;

var schema = Schema({
  name: {
    type: String,
    required: true,
    validator: types.string({
      length: 20
    })
  },
  description: {
    type: String,
    validator: types.string({
      length: 1000
    })
  },
  apis: {
    type: Object,
    required: true,
    server: true
  },
  ips: {
    type: Object,
    required: true,
    server: true
  }
}, {collection: 'tiers'});

schema.plugin(plugins());
schema.plugin(plugins.user());
schema.plugin(plugins._({
  workflow: 'model'
}));
schema.plugin(plugins.permissions({
  workflow: 'model'
}));
schema.plugin(plugins.status({
  workflow: 'model'
}));
schema.plugin(plugins.visibility({
  workflow: 'model'
}));
schema.plugin(plugins.createdAt());
schema.plugin(plugins.updatedAt());
schema.plugin(plugins.modifiedAt());

module.exports = mongoose.model('tiers', schema);
