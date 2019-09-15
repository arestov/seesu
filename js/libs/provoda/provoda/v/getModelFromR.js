define(function(require) {
'use strict';
var getModel = require('../../view/getModel')

return function(view, mdr) {
  return getModel(view, mdr._provoda_id)
}
})
