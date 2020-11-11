var log = require('logger')('model-workflows');
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
    searchable: true,
    validator: types.name({
      length: 100
    })
  },
  start: {
    type: String,
    required: true,
    searchable: true,
    validator: types.name({
      length: 100
    })
  },
  transitions: {
    type: Object,
    required: true
  },
  permits: {
    type: Object,
    required: true
  }
}, {collection: 'workflows'});

schema.plugin(plugins({
  /*transform: function (o) {
    o.transitions = JSON.parse(o.transitions);
  }*/
}));
schema.plugin(plugins.user());
schema.plugin(plugins._());
schema.plugin(plugins.permissions());
schema.plugin(plugins.visibility());
schema.plugin(plugins.createdAt());
schema.plugin(plugins.updatedAt());
schema.plugin(plugins.modifiedAt());

utils.ensureIndexes(schema, [
  {name: 1, updatedAt: 1, _id: 1}
]);

module.exports = mongoose.model('workflows', schema);
