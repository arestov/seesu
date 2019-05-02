define(function(require) {
'use strict';
var spv = require('spv')
var indexByDepName = require('./utils/indexByDepName')
var getDepsToInsert = require('./utils/getDepsToInsert')

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

function rootApis(apis_index) {
  if (!apis_index) {return;}

  var result = []
  for (var api_name in apis_index) {
    if (!apis_index.hasOwnProperty(api_name)) {
      continue
    }
    var api = apis_index[api_name]
    if (!api || !api.needed_apis) {
      continue
    }

    for (var i = 0; i < apis_index[api_name].needed_apis.length; i++) {
      var cur = apis_index[api_name].needed_apis[i]
      if (!spv.startsWith(cur, '#')) {
        continue
      }
      result.push(cur.slice(1))
    }
  }

  return result.length ? result : null;
}

return function rebuild(self, apis, typed_state_dcls) {
  getDepsToInsert(apis, self, typed_state_dcls);

  self.__apis_$_index = indexByDepName(apis) || self.__apis_$_index;
  self.__apis_$_usual = usualApis(apis) || self.__apis_$_usual;
  self.__apis_$__needs_root_apis = rootApis(apis) || null
}

})
