var log = require('logger')('initializers:serandives:configs-menus');

var async = require('async');

var sera = require('sera');

var commons = require('../commons');

var menus = [{
  name: 'www',
  value: [
    {url: '/about', title: 'About'},
    {url: '/contact', title: 'Contact'}
  ]
}, {
  name: 'www-affiliates',
  value: [
    {url: 'autos://', title: 'Autos'},
    {url: 'realestates://', title: 'Real Estates'}
  ]
}, {
  name: 'user',
  value: [
    {url: '/users/me', title: 'Profile'},
    {url: '/contacts', title: 'Contacts'},
    {url: '/locations', title: 'Locations'}
  ]
}, {
  name: 'admin',
  value: [
    {url: '/manage-locations', title: 'Locations'},
    {url: '/manage-contacts', title: 'Contacts'},
    {url: '/manage-vehicles', title: 'Vehicles'},
    {url: '/manage-realestates', title: 'RealEstates'},
    {url: '/manage-pages', title: 'Pages'},
    {url: '/manage-messages', title: 'Messages'},
    {url: '/manage-configs', title: 'Configs'}
  ]
}, {
  name: 'accounts-affiliates',
  value: [
    {url: 'autos://', title: 'Autos'},
    {url: 'realestates://', title: 'Real Estates'}
  ]
}, {
  name: 'autos-affiliates',
  value: [
    {url: 'realestates://', title: 'Real Estates'}
  ]
}, {
  name: 'autos-primary',
  value: [
    {url: '/vehicles', title: 'Search'}
  ]
}, {
  name: 'autos-secondary',
  value: [
    {url: '/create-vehicles', title: 'Add'},
    {url: '/mine', title: 'My Vehicles'}
  ]
}, {
  name: 'realestates-affiliates',
  value: [
    {url: 'autos://', title: 'Autos'}
  ]
}, {
  name: 'realestates-primary',
  value: [
    {url: '/realestates', title: 'Search'}
  ]
}, {
  name: 'realestates-secondary',
  value: [
    {url: '/create-realestates', title: 'Add'},
    {url: '/mine', title: 'My Real Estates'}
  ]
}];

module.exports = function (done) {
  commons.meta(function (err, o) {
    if (err) {
      return done(err);
    }
    var visibility = o.visibility;
    visibility.name = {
      groups: [o.public._id, o.anonymous._id]
    };
    visibility.value = {
      groups: [o.public._id, o.anonymous._id]
    };
    var menuz = {};
    async.whilst(function () {
      return menus.length
    }, function (whilstDone) {
      var menu = menus.shift();
      sera.model('configs').create({
        user: o.adminUser,
        name: 'menus-' + menu.name,
        value: JSON.stringify(menu.value),
        workflow: o.workflows.model,
        status: 'published',
        permissions: o.permissions,
        visibility: visibility,
        _: {}
      }, function (err, menu) {
        if (err) {
          return whilstDone(err);
        }
        menuz[menu.name] = menu.id;
        whilstDone();
      });
    }, function (err) {
      if (err) {
        return done(err);
      }
      sera.model('configs').create({
        user: o.adminUser,
        name: 'menus',
        value: JSON.stringify(menuz),
        workflow: o.workflows.model,
        status: 'published',
        permissions: o.permissions,
        visibility: visibility,
        _: {}
      }, function (err) {
        if (err) {
          return done(err);
        }
        log.info('menus:created');
        done();
      });
    });
  });
};
