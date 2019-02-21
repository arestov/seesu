define(function(require) {
'use strict'

var cloneObj = require('spv').cloneObj
var Dcl = require('./dcl')

function rebuild(self, index) {
  var result = {}

  for (var name in index) {
    if (!index.hasOwnProperty(name)) {
      continue
    }

    if (!name.startsWith('handleState:')) {
      continue
    }

    var state_name = name.replace('handleState:', '')
    result[state_name] = index[name]
  }

  self.__handleState = result
}

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

  rebuild(self, result)

  self._extendable_passes_index = result
}

})
