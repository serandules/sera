var log = require('logger')('model-grants');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mongoosePlugins = require('../../plugins/mongoose');
var validators = require('../../validators');
var model = require('../../model');

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

schema.plugin(mongoosePlugins());
schema.plugin(mongoosePlugins.user());
schema.plugin(mongoosePlugins._());
schema.plugin(mongoosePlugins.permissions());
schema.plugin(mongoosePlugins.visibility());
schema.plugin(mongoosePlugins.createdAt());
schema.plugin(mongoosePlugins.updatedAt());
schema.plugin(mongoosePlugins.modifiedAt());

model.ensureIndexes(schema, [
    {user: 1, client: 1}
], {unique: true});

module.exports = mongoose.model('grants', schema);
