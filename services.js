var log = require('logger')('services:index');
var _ = require('lodash');
var async = require('async');
var bodyParser = require('body-parser');

var errors = require('errors');
var auth = require('./plugins/express/auth');
var mongooseUtils = require('./utils/mongoose');
var throttle = require('./plugins/express/throttle');
var serandi = require('./plugins/express');
var model = require('./model');

var bootstrap = function (oo, prefix) {
  return function (req, res, next) {
    var name = req.params.model;
    var o = oo[name];
    if (!o || !o.service) {
      return next(errors.notFound());
    }

    req.ctx.model = o.model;
    req.ctx.service = o.service;

    serandi.serve(req, res, next,
      serandi.locate(prefix + '/' + name + '/'),
      auth(o.service.auth),
      throttle.apis(name),
      bodyParser.json(),
      function (req, res, next) {
        next();
      });
  };
};

var base = {
  auth: {
    GET: [
      '^\/$',
      '^\/.*'
    ]
  },
  xactions: {},
  workflow: 'model',
  createOne: function (req, res, next) {
    serandi.serve(req, res, next,
      serandi.json,
      function (req, res, next) {
        serandi.serve(req, res, next, serandi.create(req.ctx.model));
      },
      function (req, res, next) {
        model.create(req.ctx, function (err, o) {
          if (err) {
            if (err.code === mongooseUtils.errors.DuplicateKey) {
              return next(errors.conflict());
            }
            return next(err);
          }
          res.locate(o.id).status(201).send(o);
        });
      });
  },
  find: function (req, res, next) {
    serandi.serve(req, res, next,
      function (req, res, next) {
        serandi.serve(req, res, next, serandi.find(req.ctx.model));
      },
      function (req, res, next) {
        model.find(req.ctx, function (err, oo, paging) {
          if (err) {
            return next(err);
          }
          res.many(oo, paging);
        });
      });
  },
  findOne: function (req, res, next) {
    serandi.serve(req, res, next,
      function (req, res, next) {
        serandi.serve(req, res, next, serandi.findOne(req.ctx.model));
      },
      function (req, res, next) {
        model.findOne(req.ctx, function (err, o) {
          if (err) {
            return next(err);
          }
          res.send(o);
        });
      });
  },
  updateOne: function (req, res, next) {
    serandi.serve(req, res, next,
      serandi.json,
      function (req, res, next) {
        var service = req.ctx.service;
        serandi.serve(req, res, next, serandi.transit({
          workflow: service.workflow,
          model: req.ctx.model
        }));
      });
  },
  replaceOne: function (req, res, next) {
    serandi.serve(req, res, next,
      serandi.json,
      function (req, res, next) {
        serandi.serve(req, res, next, serandi.update(req.ctx.model));
      },
      function (req, res, next) {
        model.update(req.ctx, function (err, o) {
          if (err) {
            return next(err);
          }
          res.locate(o.id).status(200).send(o);
        });
      });
  },
  removeOne: function (req, res, next) {
    serandi.serve(req, res, next,
      function (req, res, next) {
        serandi.serve(req, res, next, serandi.remove(req.ctx.model));
      },
      function (req, res, next) {
        model.remove(req.ctx, function (err) {
          if (err) {
            return next(err);
          }
          res.status(204).end();
        });
      });
  }
};

var must = function (serve) {
  return function (req, res, next) {
    if (!serve) {
      return next(errors.notFound());
    }
    serve(req, res, next);
  };
};

var bumpers = function (service) {
  if (service.bumpup) {
    return;
  }
  var post = service.xactions.post;
  if (!post) {
    post = {};
    service.xactions.post = post;
  }
  post.bumpup = serandi.bumpup;
};

var build = function (service) {
  var serv = _.merge({}, service);

  serv.auth = serv.auth || base.auth;
  serv.xactions = serv.xactions || base.xactions;
  serv.workflow = serv.workflow || base.workflow;

  bumpers(serv);

  Object.keys(serv).forEach(function (key) {
    if (['auth', 'xactions', 'workflow', 'bumpup'].indexOf(key) !== -1) {
      return;
    }
    var val = serv[key];
    if (!val || val instanceof Function) {
      return;
    }
    serv[key] = base[key];
  });

  return serv;
};

var load = function (models, done) {
  async.each(Object.keys(models), function (name, modelDone) {
    var o = models[name];
    if (!o.service) {
      return modelDone();
    }
    o.service(function (err, service) {
      if (err) {
        return modelDone(err);
      }
      o.service = build(service);
      modelDone();
    });
  }, function (err) {
    done(err, models);
  });
};

var register = function (oo, server, prefix, done) {
  server.use(serandi.ctx);

  server.post('/:model',
    bootstrap(oo, prefix),
    function (req, res, next) {
      var service = req.ctx.service;
      serandi.serve(req, res, next, must(service.createOne));
    });

  server.post('/:model/:id',
    bootstrap(oo, prefix),
    serandi.id,
    function (req, res, next) {
      var service = req.ctx.service;
      var xactions = service.xactions;
      var actions = xactions.post;
      if (!actions) {
        return next();
      }
      serandi.serve(req, res, next, must(serandi.xactions(actions)));
    },
    function (req, res, next) {
      var service = req.ctx.service;
      serandi.serve(req, res, next, must(service.updateOne));
    });

  server.get('/:model/:id',
    bootstrap(oo, prefix),
    serandi.id,
    function (req, res, next) {
      var service = req.ctx.service;
      serandi.serve(req, res, next, must(service.findOne));
    });

  server.put('/:model/:id',
    bootstrap(oo, prefix),
    serandi.id,
    function (req, res, next) {
      var service = req.ctx.service;
      serandi.serve(req, res, next, must(service.replaceOne));
    });

  server.get('/:model',
    serandi.many,
    bootstrap(oo, prefix),
    function (req, res, next) {
      var service = req.ctx.service;
      serandi.serve(req, res, next, must(service.find));
    });

  server.delete('/:model/:id',
    bootstrap(oo, prefix),
    serandi.id,
    function (req, res, next) {
      var service = req.ctx.service;
      serandi.serve(req, res, next, must(service.removeOne));
    });

  done(null, server);
};

module.exports = function (models, server, prefix, done) {
  load(models, function (err, oo) {
    if (err) {
      return done(err);
    }
    register(oo, server, prefix, done);
  });
};
