define(function() {
'use strict'

return function rebuild(self, index) {
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

})
