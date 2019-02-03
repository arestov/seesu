define(function(require) {
'use strict';

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

return function rebuild(self, apis, typed_state_dcls) {
  getDepsToInsert(apis, self, typed_state_dcls);

  self.__apis_$_index = indexByDepName(apis) || self.__apis_$_index;
  self.__apis_$_usual = usualApis(apis) || self.__apis_$_usual;
}

})
