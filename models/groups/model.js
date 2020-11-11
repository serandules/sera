var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var plugins = require('../../plugins');
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
