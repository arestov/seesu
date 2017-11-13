define(function (require) {
'use strict';
var spv = require('spv');
var isSpecialState = require('./isSpecialState');

return function getShortStateName(state_path) {
  var enc = isSpecialState(state_path);
  return enc ? state_path : spv.getFieldsTree(state_path)[0];
};
});
