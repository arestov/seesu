define(function (require) {
'use strict';
var spv = require('spv');

var spec_chars = { '^': true, '@': true, '#': true };
var isSpecialState = spv.memorize(function (state_name) {
  return spec_chars[state_name.charAt(0)];
});

return isSpecialState;
});
