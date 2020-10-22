var log = require('logger')('model-workflows');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mongoosePlugins = require('../../plugins/mongoose');
var validators = require('../../validators');
var model = require('../../model');

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

schema.plugin(mongoosePlugins({
  /*transform: function (o) {
    o.transitions = JSON.parse(o.transitions);
  }*/
}));
schema.plugin(mongoosePlugins.user());
schema.plugin(mongoosePlugins._());
schema.plugin(mongoosePlugins.permissions());
schema.plugin(mongoosePlugins.visibility());
schema.plugin(mongoosePlugins.createdAt());
schema.plugin(mongoosePlugins.updatedAt());
schema.plugin(mongoosePlugins.modifiedAt());

model.ensureIndexes(schema, [
  {name: 1, updatedAt: 1, _id: 1}
]);

module.exports = mongoose.model('workflows', schema);
