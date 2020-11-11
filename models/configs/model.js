var log = require('logger')('model-configs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var plugins = require('../../plugins');
var validators = require('../../validators');
var utils = require('../../utils');

var types = validators.types;

var schema = Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    searchable: true,
    validator: types.name({
      length: 100
    })
  },
  value: {
    type: String,
    required: true,
    validator: types.json({
      length: 10000
    })
  }
}, {collection: 'configs'});

schema.plugin(plugins({
  transform: function (o) {
    try {
      o.value = JSON.parse(o.value);
    } catch (e) {
      o.value = null;
    }
  }
}));
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

utils.ensureIndexes(schema, [
  {name: 1, updatedAt: 1, _id: 1}
]);

module.exports = mongoose.model('configs', schema);
