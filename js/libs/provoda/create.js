define(function (require) {
'use strict';
var spv = require('spv');
var Model = require('./Model');

return function(Constr, states, params, map_parent, app) {
  var BehaviorContr = Constr || Model;
  var opts = (app || map_parent) && {
    app: app || map_parent.app,
    map_parent: map_parent
  };

  var model = new BehaviorContr(opts, null, null, null, states);
  if (model.init) {
    model.init(opts, null, null, null, states);
  }


  if (params) {
    if (params.interfaces) {
      spv.forEachKey(params.interfaces, function(intrface, interface_name, model) {
        model.useInterface(interface_name, intrface);
      }, model);
    }

    if (params.nestings) {
      spv.forEachKey(params.nestings, function(nesting, nesting_name, model) {
        model.updateNesting(nesting_name, nesting);
      }, model);
    }

  }

  return model;
};

});
