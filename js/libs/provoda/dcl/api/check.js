define(function (require) {
'use strict';

var spv = require('spv');
var checkPrefix = require('../../StatesEmitter/checkPrefix');
var indexByDepName = require('./utils/indexByDepName')
var getDepsToInsert = require('./utils/getDepsToInsert')
var ApiDeclr = require('./dcl')
var ApiEffectDeclr = require('../effects/legacy/produce/dcl')


var checkApi = checkPrefix('api-', ApiDeclr, '__apis');
var checkEffect = checkPrefix('effect-', ApiEffectDeclr, '__api_effects');

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

function rootApis(obj) {
  if (!obj) {return;}

  var index = {};

  for (var name in obj) {
    var cur = obj[name];
    if (!cur) {continue;}

    for (var i = 0; i < cur.apis.length; i++) {
      if (!spv.startsWith(cur.apis[i], '#')) {continue;}
      index[cur.apis[i].slice(1)] = true;
    }
  }

  var result = Object.keys(index);

  return result.length ? result : null;
}

function handleApis(self, props, typed_state_dcls) {
  var apis = checkApi(self, props);

  if (!apis) {
    return
  }

  getDepsToInsert(apis, self, typed_state_dcls);

  self.__apis_$_index = indexByDepName(apis) || self.__apis_$_index;
  self.__apis_$_usual = usualApis(apis) || self.__apis_$_usual;
  return true
}

function rebuildEffects(self, effects, typed_state_dcls) {
  getDepsToInsert(effects, self, typed_state_dcls);

  self.__api_effects_$_index = indexByDepName(effects) || self.__api_effects_$_index;
  self.__api_effects_$_index_by_triggering = indexByList(effects, 'triggering_states') || self.__api_effects_$_index_by_triggering;
  self.__api_effects_$_index_by_apis = indexByList(effects, 'apis') || self.__api_effects_$_index_by_apis;

  self.__api_root_dep_apis = rootApis(effects) || self.__api_root_dep_apis || null;
}

function checkEffects(self, props, typed_state_dcls) {
  var effects = checkEffect(self, props);
  if (!effects) {
    return
  }

  rebuildEffects(self, effects, typed_state_dcls)

  return true
}

return function checkApis(self, props, typed_state_dcls) {
  // var states = checkApiState(self, props);
  handleApis(self, props, typed_state_dcls)
  checkEffects(self, props, typed_state_dcls)
};

});
