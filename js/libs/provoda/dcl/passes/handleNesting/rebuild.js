define(function() {
'use strict'

return function rebuild(self, index) {
  var result = {}

  for (var name in index) {
    if (!index.hasOwnProperty(name)) {
      continue
    }

    if (!name.startsWith('handleNesting:')) {
      continue
    }

    var state_name = name.replace('handleNesting:', '')
    result[state_name] = index[name]
  }

  self.__handleNesting = result
}

})
