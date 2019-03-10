define(function(require) {
'use strict'

var cloneObj = require('spv').cloneObj
var Dcl = require('./dcl')
var rebuildHandleState = require('./handleState/rebuild')
var rebuildHandleNesting = require('./handleNesting/rebuild')
var rebuildHandleInit = require('./handleInit/rebuild')

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

  rebuildHandleState(self, result)
  rebuildHandleNesting(self, result)
  rebuildHandleInit(self, result)

  self._extendable_passes_index = result
}

})
