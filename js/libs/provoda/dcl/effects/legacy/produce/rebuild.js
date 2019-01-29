define(function(require) {
'use strict'
var spv = require('spv')
var indexByDepName = require('../../../api/utils/indexByDepName')
var getDepsToInsert = require('../../../api/utils/getDepsToInsert')

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

return function rebuildEffects(self, effects, typed_state_dcls) {
  getDepsToInsert(effects, self, typed_state_dcls);

  self.__api_effects_$_index = indexByDepName(effects) || self.__api_effects_$_index;
  self.__api_effects_$_index_by_triggering = indexByList(effects, 'triggering_states') || self.__api_effects_$_index_by_triggering;
  self.__api_effects_$_index_by_apis = indexByList(effects, 'apis') || self.__api_effects_$_index_by_apis;

  self.__api_root_dep_apis = rootApis(effects) || self.__api_root_dep_apis || null;
}
})
