var log = require('logger')('model-taxonomies');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var plugins = require('../../plugins');
var validators = require('../../validators');
var utils = require('../../utils');

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
    },
    taxonomy: {
        type: Schema.Types.ObjectId,
        ref: 'taxonomies',
        validator: types.ref()
    }
}, {collection: 'taxonomies'});

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

utils.ensureIndexes(schema, [
  {updatedAt: -1, _id: -1}
]);

module.exports = mongoose.model('taxonomies', schema);
