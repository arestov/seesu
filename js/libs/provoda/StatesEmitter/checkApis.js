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

var ApiDeclr = function(name, data) {
  this.name = name;

  this.fn = null;
  this.deps = null;
  this.deps_name = null;

  if (typeof data == 'function') {
    this.fn = data;
  } else {
    this.deps = wrapDeps(data[0]);
    this.deps_name = '_need_api_' + name;
    this.fn = data[1];
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

  switch (data.length) {
    case 3: {
      this.triggering_states = data[1][0];
      this.effects_deps = data[1][1];
      this.fn = data[2];
    }
    break;
    case 4: {
      this.deps = wrapDeps(data[1]);
      this.deps_name = '_need_api_effect' + name;

      this.triggering_states = data[2][0];
      this.effects_deps = data[2][1];
      this.fn = data[3];
    }
    break;
  }

};

var checkApi = checkPrefix('api-', ApiDeclr, '__apis');
var checkEffect = checkPrefix('effect-', ApiEffectDeclr, '__api_effects');

var copyCompxToProps = function(source, props, self) {
  if (!source) {
    return;
  }

  for (var name in source) {
    if (!source.hasOwnProperty(name)) {
      continue;
    }
    var cur = source[name];
    if (!cur.deps_name) {
      continue;
    }
    self['compx-' + cur.deps_name] = props['compx-' + cur.deps_name] = cur.deps;
  }
};

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

return function checkApis(self, props) {
  var apis = checkApi(self, props);
  // var states = checkApiState(self, props);
  var effects = checkEffect(self, props);

  copyCompxToProps(apis, props, self);
  copyCompxToProps(effects, props, self);

  self.__apis_$_index = indexByDepName(apis) || self.__apis_$_index;
  self.__apis_$_usual = usualApis(apis) || self.__apis_$_usual;
  self.__api_effects_$_index = indexByDepName(effects) || self.__api_effects_$_index;
  self.__api_effects_$_index_by_triggering = indexByList(effects, 'triggering_states') || self.__api_effects_$_index_by_triggering;

  collectStatesBinders(self, props);
};

});
