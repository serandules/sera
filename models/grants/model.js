var log = require('logger')('model-grants');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var plugins = require('../../plugins');
var validators = require('../../validators');
var utils = require('../../utils');

var types = validators.types;

var schema = Schema({
    client: {
        type: Schema.Types.ObjectId,
        ref: 'clients',
        validator: types.ref(),
        searchable: true,
        required: true
    }
}, {collection: 'grants'});

schema.plugin(plugins());
schema.plugin(plugins.user());
schema.plugin(plugins._());
schema.plugin(plugins.permissions());
schema.plugin(plugins.visibility());
schema.plugin(plugins.createdAt());
schema.plugin(plugins.updatedAt());
schema.plugin(plugins.modifiedAt());

utils.ensureIndexes(schema, [
    {user: 1, client: 1}
], {unique: true});

module.exports = mongoose.model('grants', schema);
