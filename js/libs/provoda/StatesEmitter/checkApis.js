define(function (require) {
'use strict';

var spv = require('spv');
var checkPrefix = require('./checkPrefix');
var collectStatesBinders = require('./collectStatesBinders');

var wrapDeps = function(deps) {
  if (typeof deps == 'string') {
    return [[deps]];
  }
  if (Array.isArray(deps) && typeof deps[0] == 'string') {
    return [deps, spv.hasEveryArgs];
  }

  return deps;
};

var prefixArray = function (arr, prefix) {
  var result = new Array(arr.length);
  for (var i = 0; i < arr.length; i++) {
    result[i] = prefix + arr[i];
  }
  return result;
};

var ApiDeclr = function(name, data) {
  this.name = name;

  this.fn = null;
  this.triggering_deps = null;
  this.triggering_deps_name = null;

  this.needed_apis = null;
  this.needed_apis_dep = null;
  this.needed_apis_dep_name = null;

  this.deps = null;
  this.deps_name = null;

  this.compxes = null;

  if (typeof data == 'function') {
    this.fn = data;
  } else {
    switch (data.length) {
      case 2: {
        this.triggering_deps = wrapDeps(data[0]);
        this.triggering_deps_name = '_triggered_api_' + name;

        this.deps = this.triggering_deps;
        this.deps_name = this.triggering_deps_name;

        this.fn = data[1];
        this.compxes = [
          this.deps_name, this.deps,
        ];
      }
      break;
      case 3:{
        this.triggering_deps = wrapDeps(data[0]);
        this.triggering_deps_name = '_triggered_api_' + name;

        this.needed_apis = data[1];
        this.needed_apis_dep = wrapDeps(prefixArray(this.needed_apis, '_api_used_'));
        this.needed_apis_dep_name = '_apis_need_for_' + name;

        this.deps = wrapDeps([this.triggering_deps_name, this.needed_apis_dep_name]);
        this.deps_name = '_api_all_needs_' + name;

        this.compxes = [
          this.triggering_deps_name, this.triggering_deps,
          this.needed_apis_dep_name, this.needed_apis_dep,
          this.deps_name, this.deps
        ];

        this.fn = data[2];
      }
      break;
    }

  }
};

var ApiEffectDeclr = function(name, data) {

  this.name = name;
  this.apis = spv.toRealArray(data[0]);
  this.triggering_states = null;
  this.deps = null;
  this.deps_name = null;
  this.effects_deps = null;
  this.fn = null;

  this.compxes = null;

  switch (data.length) {
    case 3: {
      this.triggering_states = data[1][0];
      this.effects_deps = data[1][1];
      this.fn = data[2];
    }
    break;
    case 4: {
      this.deps = wrapDeps(data[1]);
      this.deps_name = '_need_api_effect_' + name;

      this.compxes = [
        this.deps_name, this.deps
      ];

      this.triggering_states = data[2][0];
      this.effects_deps = data[2][1];
      this.fn = data[3];
    }
    break;
  }

};

var checkApi = checkPrefix('api-', ApiDeclr, '__apis');
var checkEffect = checkPrefix('effect-', ApiEffectDeclr, '__api_effects');

var indexByDepName = function (obj) {
  if (!obj) {
    return;
  }
  var result = {};

  for (var name in obj) {
    if (!obj.hasOwnProperty(name)) {
      continue;
    }
    var cur = obj[name];
    if (!cur.deps_name) {
      continue;
    }
    result[cur.deps_name] = cur;
  }

  return result;
};

var indexByList = function (obj, list_name) {
  if (!obj) {
    return;
  }
  var result = {};

  for (var name in obj) {
    if (!obj.hasOwnProperty(name)) {
      continue;
    }
    var cur = obj[name];
    var list = cur[list_name];
    if (!list) {
      continue;
    }
    for (var i = 0; i < list.length; i++) {
      var state_name = list[i];
      if (!result[state_name]) {
        result[state_name] = [];
      }
      result[state_name].push(cur);
    }
  }

  return result;
};

var usualApis = function (obj) {
  if (!obj) {
    return;
  }

  var result = [];

  for (var name in obj) {
    if (!obj.hasOwnProperty(name)) {
      continue;
    }
    var cur = obj[name];
    if (cur.deps_name) {
      continue;
    }

    result.push(cur);
  }

  return result;
};

var doCopy = function (item, self, props) {
  for (var i = 0; i < item.compxes.length; i+=2) {
    var name = item.compxes[ i ];
    var deps = item.compxes[ i + 1 ];

    self['compx-' + name] = props['compx-' + name] = deps;
  }
};

var getDepsToInsert = function (source, self, props) {
  if (!source) {return;}

  for (var name in source) {
    if (!source.hasOwnProperty(name)) {continue;}

    var cur = source[name];
    if (!cur.compxes) {continue;}

    doCopy(cur, self, props);
  }
};

return function checkApis(self, props) {
  var apis = checkApi(self, props);
  // var states = checkApiState(self, props);
  var effects = checkEffect(self, props);

  getDepsToInsert(apis, self, props);
  getDepsToInsert(effects, self, props);

  self.__apis_$_index = indexByDepName(apis) || self.__apis_$_index;
  self.__apis_$_usual = usualApis(apis) || self.__apis_$_usual;
  self.__api_effects_$_index = indexByDepName(effects) || self.__api_effects_$_index;
  self.__api_effects_$_index_by_triggering = indexByList(effects, 'triggering_states') || self.__api_effects_$_index_by_triggering;

  collectStatesBinders(self, props);
};

});
