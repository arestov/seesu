define(function (require) {
'use strict';

var spv = require('spv');
var pvUpdate = require('../updateProxy').update;

var getStateUpdater = function(em, state_name) {
  if (!em._state_updaters) {
    em._state_updaters = {};
  }
  if (!em._state_updaters.hasOwnProperty(state_name)) {
    em._state_updaters[state_name] = function(value) {
      em.updateState(state_name, value);
    };
  }
  return em._state_updaters[state_name];
};

var checkState = function (using, binder) {
  var keys = using.binders.indexes[binder.state_name];
  var value = true;
  for (var i = 0; i < binder.apis.length; i++) {
    if (!keys[binder.apis[i]]) {
      value = false;
      break;
    }
  }

  using.binders.values[binder.state_name] = value;
  return using;
};

var markApi = function (index, using, interface_name, mark) {
  var list = index && index[interface_name];
  if (!list || !list.length) {
    return using;
  }

  for (var i = 0; i < list.length; i++) {
    var cur = list[i];
    if (!using.binders.indexes[cur.state_name]) {
      using.binders.indexes[cur.state_name] = {};
    }
    using.binders.indexes[cur.state_name][interface_name] = mark;
  }

  var result = using;
  for (var i = 0; i < list.length; i++) {
    var cur = list[i];
    result = checkState(result, cur);
  }
  return result;
};

var template = function (self) {
  return {
    used: {self: self},
    binders: {
      indexes: {},
      values: {},
      removers: {}
    },
  };
};

var makeBindChanges = function (self, index, using, original_values) {
  // _build_cache_interfaces
  for (var state_name in using.binders.values) {
    var change = Boolean(original_values[state_name]) != Boolean(using.binders.values[state_name]);
    if (!change) {
      continue;
    }

    if (using.binders.values[state_name]) {
      var apis = index[state_name].apis;
      var bind_args = new Array(apis.length + 1);
      bind_args[0] = getStateUpdater(self, state_name);
      for (var i = 0; i < apis.length; i++) {
        bind_args[i + 1] = using.used[apis[i]];
      }
      using.binders.removers[state_name] = index[state_name].fn.apply(null, bind_args);
    } else {
      using.binders.removers[state_name].call();
      using.binders.removers[state_name] = null;
    }
  }

  return using;
};

return function (self, interface_name, obj) {
  var using = self._interfaces_using;
  var old_interface = using && using.used[interface_name];
  if (obj === old_interface) {
    return;
  }

  if (!using) {
    using = self._interfaces_using = template(self);
  }

  var values_original = spv.cloneObj({}, using.binders.values);
  using.used[interface_name] = null;
  using = self._interfaces_using = markApi(self._interfaces_to_states_index, using, interface_name, false);
  using = self._interfaces_using = makeBindChanges(self, self._build_cache_interfaces, using, values_original);

  if (!obj) {
    pvUpdate(self, '_api_used_' + interface_name, false);
    return;
  }

  var values_original2 = spv.cloneObj({}, using.binders.values);
  using.used[interface_name] = obj;
  using = self._interfaces_using = markApi(self._interfaces_to_states_index, using, interface_name, true);
  using = self._interfaces_using = makeBindChanges(self, self._build_cache_interfaces, using, values_original2);
  pvUpdate(self, '_api_used_' + interface_name, true);
};
});
