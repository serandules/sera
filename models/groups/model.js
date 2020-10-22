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
    }
}, {collection: 'groups'});

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

/*
group.methods.can = function (perm, action) {
    return permission.has(this.has, perm.split(':'), action);
};

group.methods.permit = function (perm, actions, done) {
    actions = actions instanceof Array ? actions : [actions];
    permission.add(this.has, perm.split(':'), actions);
    this.save(done);
};*/

module.exports = mongoose.model('groups', schema);
