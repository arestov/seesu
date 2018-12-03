define(function(require) {
'use strict';
var getStart = require('../utils/multiPath/getStart');

return function getStartModel(target, nwatch) {
  if (!nwatch) {
    return target
  }

  var start_md = getStart(target, nwatch.nmpath_source)
  return start_md
}
})
