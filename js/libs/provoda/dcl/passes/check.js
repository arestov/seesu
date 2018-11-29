define(function(require) {
'use strict'

var cloneObj = require('spv').cloneObj
var Dcl = require('./dcl')

return function checkPasses(self, props) {
  if (!props.hasOwnProperty('+passes')) {
    return
  }

  var result = {}
  cloneObj(result, self._extendable_passes_index || {})

  for (var name in props['+passes']) {
    if (!props['+passes'].hasOwnProperty(name)) {
      continue;
    }
    result[name] = new Dcl(name, props['+passes'][name])
  }

  self._extendable_passes_index = result
}

})
