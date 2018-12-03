define(function(require) {
'use strict';
var initDeclaredNestings = require('../initDeclaredNestings');
var getSPByPathTemplate = initDeclaredNestings.getSPByPathTemplate

return function getStartModel(target, nwatch) {
  var start_point  = nwatch && nwatch.nmpath_source.start_point
  var start_md = start_point
    ? getSPByPathTemplate(target.app, target, start_point)
    : target;

  return start_md
}
})
