define(function (require) {
'use strict';
var spv = require('spv');
var isSpecialState = require('./isSpecialState');

var getTargetField = spv.getTargetField;
var stateGetter = spv.memorize(function stateGetter(state_path) {
  if (isSpecialState(state_path)) {
    return function(states) {
      return states[state_path];
    };
  }
  return function(states) {
    return getTargetField(states, state_path);
  };
});

return stateGetter;
});
