define(function() {
'use strict';
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
  self._interfaces_to_states_index = index;
}
})
