define(function(require) {
'use strict';
var getModels = require('../../../utils/multiPath/getModels')


var getModelsFromBase = function(base, target) {
  var multi_path = target.target_path
  return getModels(base, multi_path);
}

var getModelsFromManyBases = function(bases, target) {
  if (!Array.isArray(bases)) {
    return getModelsFromBase(bases, target)
  }

  var result = []
  for (var i = 0; i < bases.length; i++) {
    var mds = getModelsFromBase(bases[i], target)
    Array.prototype.push.apply(result, mds);
  }
  return result;
}

var getTargetModels = function(md, target, data) {
  switch (target.options && target.options.base) {
    case "arg_nesting_next": {
      return getModelsFromManyBases(data.next_value, target)
    }
    case "arg_nesting_prev": {
      return getModelsFromManyBases(data.prev_value, target)
    }
  }

  return getModelsFromBase(md, target);
}
return getTargetModels

})
