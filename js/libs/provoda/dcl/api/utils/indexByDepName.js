define(function() {
'use strict'
return function indexByDepName (obj) {
  if (!obj) {
    return;
  }
  var result = {};

  for (var name in obj) {
    if (!obj.hasOwnProperty(name)) {
      continue;
    }
    var cur = obj[name];
    if (!cur.deps_name) {
      continue;
    }
    result[cur.deps_name] = cur;
  }

  return result;
};
})
