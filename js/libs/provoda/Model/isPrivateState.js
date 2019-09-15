define(function(require) {
'use strict';
var memorize = require('spv').memorize
var isPrivate = memorize(function(str) {
  return str.startsWith('__')
});
return isPrivate
})
