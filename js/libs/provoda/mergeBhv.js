define(function(require) {
'use strict';
var spv = require('spv');
var cloneObj = spv.cloneObj;
return function mergeBhv(target, source) {
  var originalExtStates = target['+states'];
  var copy = spv.cloneObj(target, source);

  if (originalExtStates && source['+states']) {
    var newStates = cloneObj({}, originalExtStates);
    newStates = cloneObj(newStates, source['+states']);
    copy['+states'] = newStates;
  }

  return copy;
}

});
