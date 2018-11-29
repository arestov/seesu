define(function(require) {
'use strict';
var pvState = require('../../provoda/state')
var getNesting = require('../../provoda/getNesting')

var getValue = function(md, multi_path) {
  if (multi_path.nesting && multi_path.nesting.zip_name) {
    throw new Error('implenent me')
  }

  switch (multi_path.result_type) {
    case "nesting": {
      return getNesting(md, multi_path.nesting.target_nest_name)
    }
    case "state": {
      return pvState(md, multi_path.state.base)
    }
  }
  console.warn('is it good idea!?', 'should not we throw error here?')

  return md
}

return function(models, multi_path) {
  if (!Array.isArray(models)) {
    return getValue(models, multi_path)
  }

  var result = new Array(models.length)
  for (var i = 0; i < models.length; i++) {
    result[i] = getValue(models[i], multi_path)
  }

  return result;

};
})
