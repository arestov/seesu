define(function(require) {
'use strict';
var spv = require('spv')
var rootApis = function(list) {

  var index = {}
  for (var i = 0; i < list.length; i++) {
    var apis = list[i].apis;

    for (var jj = 0; jj < apis.length; jj++) {
      var cur = apis[jj]
      if (!spv.startsWith(cur, '#')) {continue;}
      index[cur.slice(1)] = true;
    }
  }

  return Object.keys(index)
}

return function(self, list) {
  self._build_cache_interfaces = {};

  self._interfaces_to_states_index = {};

  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    self._build_cache_interfaces[item.state_name] = item;
  }

  var index = {};
  for (var i = 0; i < list.length; i++) {
    var apis = list[i].apis;
    for (var b = 0; b < apis.length; b++) {
      var name = apis[b];
      if (!index[name]) {
        index[name] = [];
      }
      index[name].push(list[i]);
    }
  }



  self.__api_root_dep_apis_subscribe_eff = rootApis(list);
  self._interfaces_to_states_index = index;
}
})
