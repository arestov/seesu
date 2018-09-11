define(function(require) {
'use strict';

var Runner = require('./runner')

return function (self) {
  if (!self._nest_by_type_listed || !self._nest_by_type_listed.compx) {
    return;
  }

  var compx_list = self._nest_by_type_listed.compx

  for (var i = 0; i < compx_list.length; i++) {
    var cur = compx_list[i]
    new Runner(self, cur);
  }
}
})
