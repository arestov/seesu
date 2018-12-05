define(function(require) {
'use strict';
var fromFromNeoLegacy = require('../multiPath/fromNeoLegacy')

return function(nesting_source) {
  return fromFromNeoLegacy(nesting_source)
}

});
