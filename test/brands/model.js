var log = require('logger')('model-brands');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sera = require('../../index');
var plugins = require('../../plugins');
var validators = require('../../validators');
var utils = require('../../utils');

var tagger = require('./tagger');

var types = validators.types;

var schema = Schema({
    title: {
        type: String,
        required: true,
        validator: types.title({
            length: 100
        })
    },
    description: {
        type: String,
        required: true,
        validator: types.string({
            length: 5000
        })
    }
}, {collection: 'brands'});

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

schema.plugin(plugins.tags({
    client: tagger
}));

utils.ensureIndexes(schema, [
  {updatedAt: -1, _id: -1}
]);

module.exports = mongoose.model('brands', schema);
