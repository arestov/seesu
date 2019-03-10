define(function(require) {
'use strict'

var getDeprefixFunc = require('spv').getDeprefixFunc
var check = getDeprefixFunc('handleNesting:')

return function rebuild(self, index) {
  var result = {}

  for (var name in index) {
    if (!index.hasOwnProperty(name)) {
      continue
    }

    var result_name = check(name)

    if (!result_name) {
      continue
    }

    result[result_name] = index[name]
  }

  self.__handleNesting = result
}

})
