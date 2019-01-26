define(function(require) {
'use strict';
var spv = require('spv');

return function assign(typed_state_dcls, nest_declr) {
  typed_state_dcls['compx'] = typed_state_dcls['compx'] || {};
  typed_state_dcls['compx'][nest_declr.state_dep] = [nest_declr.dependencies, spv.hasEveryArgs];
};

})
