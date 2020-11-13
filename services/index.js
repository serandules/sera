var log = require('logger')('services:index');
var _ = require('lodash');
var async = require('async');
var bodyParser = require('body-parser');

var errors = require('errors');
var middlewares = require('../middlewares');
var utils = require('../utils');
var validators = require('../validators');

var validate = function (name, ctx, done) {
  if (ctx.validated) {
    return done();
  }
  var validator = validators.model[name];
  validator.call(validator.model, ctx, done);
};

var bootstrap = function (oo, prefix) {
  return function (req, res, next) {
    var name = req.params.model;
    var o = oo[name];
    if (!o || !o.service) {
      return next(errors.notFound());
    }

    req.ctx.model = o.model;
    req.ctx.service = o.service;

    middlewares.serve(req, res, next,
      middlewares.locate(prefix + '/' + name + '/'),
      middlewares.auth(o.service.auth),
      middlewares.throttleByAPI(name),
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
    middlewares.serve(req, res, next,
      middlewares.json,
      function (req, res, next) {
        middlewares.serve(req, res, next, middlewares.create(req.ctx.model));
      },
      function (req, res, next) {
        exports.create(req.ctx, function (err, o) {
          if (err) {
            if (err.code === errors.mongoose.DuplicateKey) {
              return next(errors.conflict());
            }
            return next(err);
          }
          res.locate(o.id).status(201).send(o);
        });
      });
  },
  find: function (req, res, next) {
    middlewares.serve(req, res, next,
      function (req, res, next) {
        middlewares.serve(req, res, next, middlewares.find(req.ctx.model));
      },
      function (req, res, next) {
        exports.find(req.ctx, function (err, oo, paging) {
          if (err) {
            return next(err);
          }
          res.many(oo, paging);
        });
      });
  },
  findOne: function (req, res, next) {
    middlewares.serve(req, res, next,
      function (req, res, next) {
        middlewares.serve(req, res, next, middlewares.findOne(req.ctx.model));
      },
      function (req, res, next) {
        exports.findOne(req.ctx, function (err, o) {
          if (err) {
            return next(err);
          }
          res.send(o);
        });
      });
  },
  updateOne: function (req, res, next) {
    middlewares.serve(req, res, next,
      middlewares.json,
      function (req, res, next) {
        var service = req.ctx.service;
        middlewares.serve(req, res, next, middlewares.transit({
          workflow: service.workflow,
          model: req.ctx.model
        }));
      });
  },
  replaceOne: function (req, res, next) {
    middlewares.serve(req, res, next,
      middlewares.json,
      function (req, res, next) {
        middlewares.serve(req, res, next, middlewares.update(req.ctx.model));
      },
      function (req, res, next) {
        exports.update(req.ctx, function (err, o) {
          if (err) {
            return next(err);
          }
          res.locate(o.id).status(200).send(o);
        });
      });
  },
  removeOne: function (req, res, next) {
    middlewares.serve(req, res, next,
      function (req, res, next) {
        middlewares.serve(req, res, next, middlewares.remove(req.ctx.model));
      },
      function (req, res, next) {
        exports.remove(req.ctx, function (err) {
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

var build = function (service) {
  var serv = _.merge({}, service);

  serv.auth = serv.auth || base.auth;
  serv.xactions = serv.xactions || base.xactions;
  serv.workflow = serv.workflow || base.workflow;

  var actions = [
    'find',
    'findOne',
    'replaceOne',
    'removeOne',
    'createOne',
    'updateOne'
  ];

  actions.forEach(function (key) {
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
  server.use(middlewares.ctx);

  server.post('/:model',
    bootstrap(oo, prefix),
    function (req, res, next) {
      var service = req.ctx.service;
      middlewares.serve(req, res, next, must(service.createOne));
    });

  server.post('/:model/:id',
    bootstrap(oo, prefix),
    middlewares.id,
    function (req, res, next) {
      var service = req.ctx.service;
      var xactions = service.xactions;
      var actions = xactions.post;
      if (!actions) {
        return next();
      }
      middlewares.serve(req, res, next, must(middlewares.xactions(actions)));
    },
    function (req, res, next) {
      var service = req.ctx.service;
      middlewares.serve(req, res, next, must(service.updateOne));
    });

  server.get('/:model/:id',
    bootstrap(oo, prefix),
    middlewares.id,
    function (req, res, next) {
      var service = req.ctx.service;
      middlewares.serve(req, res, next, must(service.findOne));
    });

  server.put('/:model/:id',
    bootstrap(oo, prefix),
    middlewares.id,
    function (req, res, next) {
      var service = req.ctx.service;
      middlewares.serve(req, res, next, must(service.replaceOne));
    });

  server.get('/:model',
    middlewares.many,
    bootstrap(oo, prefix),
    function (req, res, next) {
      var service = req.ctx.service;
      middlewares.serve(req, res, next, must(service.find));
    });

  server.delete('/:model/:id',
    bootstrap(oo, prefix),
    middlewares.id,
    function (req, res, next) {
      var service = req.ctx.service;
      middlewares.serve(req, res, next, must(service.removeOne));
    });

  done(null, server);
};

exports.boot = function (models, server, prefix, done) {
  load(models, function (err, oo) {
    if (err) {
      return done(err);
    }
    register(oo, server, prefix, done);
  });
};

exports.create = function (ctx, done) {
  validate('create', ctx, function (err) {
    if (err) {
      return done(err);
    }
    ctx.model.create(ctx.data, function (err, o) {
      if (err) {
        if (err.code === errors.mongoose.DuplicateKey) {
          return done(errors.conflict());
        }
        return done(err);
      }
      utils.notify(ctx.model.modelName, o.id, 'create', utils.diff({}, o), function (err) {
        done(err, o);
      });
    });
  });
};

exports.update = function (ctx, done) {
  validate('update', ctx, function (err) {
    if (err) {
      return done(err);
    }
    ctx.model.findOneAndUpdate(ctx.query, ctx.data, {new: true}, function (err, o) {
      if (err) {
        return done(err);
      }
      if (!o) {
        return done(errors.notFound());
      }
      utils.notify(ctx.model.modelName, o.id, 'update', utils.diff(ctx.found, o), function (err) {
        done(err, o);
      });
    });
  });
};

exports.findOne = function (ctx, done) {
  validate('findOne', ctx, function (err) {
    if (err) {
      return done(err);
    }
    ctx.model.findOne(ctx.query).exec(function (err, o) {
      if (err) {
        return done(err);
      }
      if (!o) {
        return done(errors.notFound());
      }
      utils.visibles(ctx, utils.json(o), done);
    });
  });
};

exports.remove = function (ctx, done) {
  validate('remove', ctx, function (err) {
    if (err) {
      return done(err);
    }
    ctx.model.remove(ctx.query).exec(function (err, o) {
      if (err) {
        return done(err);
      }
      if (!o.n) {
        return done(errors.notFound());
      }
      utils.notify(ctx.model.modelName, o.id, 'remove', {}, function (err) {
        done(err, o);
      });
    });
  });
};

exports.find = function (ctx, done) {
  validate('find', ctx, function (err) {
    if (err) {
      return done(err);
    }
    var hint;
    var invert;
    var sorter;
    var search = ctx.search;
    var query = search.query;
    var sort = search.sort;
    var count = search.count + 1;
    var order = sort[utils.first(sort)];
    var direction = search.direction || order;
    var natural = (direction === 1);
    if (order === 1) {
      hint = sort;
      invert = !natural;
      sorter = invert ? utils.invert(sort) : sort;
    } else {
      hint = utils.invert(sort);
      invert = natural;
      sorter = invert ? hint : sort;
    }
    var fields = _.clone(search.fields);
    if (fields) {
      fields.visibility = 1;
    }
    var options = {};
    if (search.cursor) {
      if (natural) {
        options.min = search.cursor;
      } else {
        options.max = search.cursor;
      }
    }
    var filter = function (o) {
      if (!fields) {
        return o;
      }
      if (fields.visibility) {
        return o;
      }
      var filtered = {};
      Object.keys(o).forEach(function (field) {
        if (fields[field]) {
          filtered[field] = o[field];
        }
      });
      return filtered;
    };
    var queried = ctx.queried;
    ctx.model.find(query)
      .sort(sorter)
      .select(fields)
      .limit(count)
      .hint(hint)
      .setOptions(options)
      .exec(function (err, oo) {
        if (err) {
          return done(err);
        }
        var left = null;
        var right = null;
        if (natural) {
          if (oo.length === count) {
            right = {
              query: queried,
              sort: sort,
              cursor: utils.cursor(hint, oo.pop()),
              direction: 1
            };
          }
          if (search.cursor) {
            left = {
              query: queried,
              sort: sort,
              cursor: search.cursor,
              direction: -1
            };
          }
        } else {
          if (search.cursor) {
            right = {
              query: queried,
              sort: sort,
              cursor: search.cursor,
              direction: 1
            };
          }
          if (oo.length === count) {
            oo.pop();
            left = {
              query: queried,
              sort: sort,
              cursor: utils.cursor(hint, oo[oo.length - 1]),
              direction: -1
            };
          }
        }
        var prev;
        var next;
        if (order === 1) {
          next = right;
          prev = left;
        } else {
          next = left;
          prev = right;
        }
        oo = invert ? oo.reverse() : oo;
        var ooo = [];
        async.eachSeries(oo, function (o, eachDone) {
          utils.visibles(ctx, filter(utils.json(o)), function (err, o) {
            if (err) {
              return eachDone(err);
            }
            ooo.push(o);
            eachDone();
          })
        }, function (err) {
          if (err) {
            return done(err);
          }
          done(null, ooo, {prev: prev, next: next});
        });
      });
  });
};