define(function(require) {
'use strict';
var spv = require('spv');
var Model = require('../Model');

return function behavior(declr, declr_extend_from, named) {
  var behaviorFrom = declr_extend_from || Model;
  if (typeof named == 'object' || !declr.init) {
    return spv.inh(behaviorFrom, {
      naming: named && named.naming,
      init: named && named.init,
      props: declr
    });
  }
  var func = named || function() {};
  behaviorFrom.extendTo(func, declr);
  return func;
}
})
