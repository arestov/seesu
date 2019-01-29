define(function() {
'use strict';
return function(self) {
  if (self.__apis_$_usual && self.__apis_$_usual.length) {
    for (var i = 0; i < self.__apis_$_usual.length; i++) {
      var cur = self.__apis_$_usual[i];
      self.useInterface(cur.name, cur.fn());
    }
  }

  if (self.__api_root_dep_apis) {
    for (var i = 0; i < self.__api_root_dep_apis.length; i++) {
      var cur = self.__api_root_dep_apis[i];
      var api = self.app._interfaces_using.used[cur]
      self.useInterface('#' + cur, api);
    }
  }

  if (self.__api_effects_$_index_by_apis && self.__api_effects_$_index_by_apis['self']) {
    self.useInterface('self', self);
  }
}
})
