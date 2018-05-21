define(function(require) {
'use strict';
var initDeclaredNestings = require('../initDeclaredNestings');
var prsStCon = require('../prsStCon');
var initNestWatchers = require('../nest-watch/index').init;

return function postInitModel(self) {
  // prefill own states before connecting relations
  self.__initStates();

  prsStCon.connect.parent(self);
  prsStCon.connect.root(self);
  prsStCon.connect.nesting(self);

  if (self.nestings_declarations) {
    self.nextTick(initDeclaredNestings, null, false, self.current_motivator);
  }

  initNestWatchers(self);

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
