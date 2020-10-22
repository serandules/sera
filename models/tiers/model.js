var log = require('logger')('model-tiers');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mongoosePlugins = require('../../plugins/mongoose');
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

schema.plugin(mongoosePlugins());
schema.plugin(mongoosePlugins.user());
schema.plugin(mongoosePlugins._({
  workflow: 'model'
}));
schema.plugin(mongoosePlugins.permissions({
  workflow: 'model'
}));
schema.plugin(mongoosePlugins.status({
  workflow: 'model'
}));
schema.plugin(mongoosePlugins.visibility({
  workflow: 'model'
}));
schema.plugin(mongoosePlugins.createdAt());
schema.plugin(mongoosePlugins.updatedAt());
schema.plugin(mongoosePlugins.modifiedAt());

module.exports = mongoose.model('tiers', schema);
