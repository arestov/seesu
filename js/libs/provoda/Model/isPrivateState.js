define(function(require) {
'use strict';

var spv = require('spv')
var memorize = spv.memorize
var isPrivate = memorize(function(str) {
  return str.startsWith('__')
});
return isPrivate
})
