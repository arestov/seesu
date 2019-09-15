define(function() {
'use strict';
var connectRootApis = function(self, list) {
  if (!list) {
    return
  }
  for (var i = 0; i < list.length; i++) {
    var cur = list[i];
    var api = self.app._interfaces_using.used[cur]
    self.useInterface('#' + cur, api);
  }
}

return function(self) {
  if (self.__apis_$_usual && self.__apis_$_usual.length) {
    for (var i = 0; i < self.__apis_$_usual.length; i++) {
      var cur = self.__apis_$_usual[i];
      self.useInterface(cur.name, cur.fn());
    }
  }

  connectRootApis(self, self.__apis_$__needs_root_apis)
  connectRootApis(self, self.__api_root_dep_apis)
  connectRootApis(self, self.__api_root_dep_apis_subscribe_eff)

  if (self.__api_effects_$_index_by_apis && self.__api_effects_$_index_by_apis['self']) {
    self.useInterface('self', self);
  }
}
})
