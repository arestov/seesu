define(function (require) {
'use strict';

var checkPrefix = require('../../StatesEmitter/checkPrefix');
var indexByDepName = require('./utils/indexByDepName')
var getDepsToInsert = require('./utils/getDepsToInsert')
var ApiDeclr = require('./dcl')
var ApiEffectDeclr = require('../effects/legacy/produce/dcl')
var rebuildEffects = require('../effects/legacy/produce/rebuild')

var checkApi = checkPrefix('api-', ApiDeclr, '__apis');
var checkEffect = checkPrefix('effect-', ApiEffectDeclr, '__api_effects');

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
