define(function(require) {
'use strict';
var pvState = require('../../provoda/state')
var getNesting = require('../../provoda/getNesting')

var getValue = function(md, multi_path) {
  if (multi_path.zip_name) {
    throw new Error('implenent me')
  }

  switch (multi_path.result_type) {
    case "nesting": {
      if (!multi_path.nesting.target_nest_name) {
        return md
      }
      return getNesting(md, multi_path.nesting.target_nest_name)
    }
    case "state": {
      return pvState(md, multi_path.state.base)
    }
  }

  if (multi_path.as_string != '<<<<') {
    console.warn('is it good idea!?', 'should not we throw error here?')
  }

  return md
}

return function(models, multi_path) {
  if (!Array.isArray(models)) {
    return getValue(models, multi_path)
  }

  var result = []
  for (var i = 0; i < models.length; i++) {
    var cur = getValue(models[i], multi_path)
    if (!cur) {continue}
    result.push(cur)
  }

  if (multi_path.result_type !== 'nesting') {
    return result
  }

  return Array.prototype.concat.apply([], result)

};
})
