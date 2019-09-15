define(function(require) {
'use strict';
var getModel = require('../../View/getModel')

return function(view, mdr) {
  return getModel(view, mdr._provoda_id)
}
})
