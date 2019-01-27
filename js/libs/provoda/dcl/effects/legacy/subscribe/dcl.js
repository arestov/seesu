define(function(require) {
'use strict'
var spv = require('spv')

return function StateBindDeclr(state_name, data) {
  this.state_name = state_name;
  this.apis = null;
  this.fn = null;


  if (Array.isArray(data)) {
    // legacy ?
    this.apis = spv.toRealArray(data[0]);
    this.fn = data[1];
    return
  }

  this.apis = spv.toRealArray(data.api);
  this.fn = data.fn;
};
})
