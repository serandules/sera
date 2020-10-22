var log = require('logger')('model-configs');
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

schema.plugin(mongoosePlugins({
  transform: function (o) {
    try {
      o.value = JSON.parse(o.value);
    } catch (e) {
      o.value = null;
    }
  }
}));
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

model.ensureIndexes(schema, [
  {name: 1, updatedAt: 1, _id: 1}
]);

module.exports = mongoose.model('configs', schema);
