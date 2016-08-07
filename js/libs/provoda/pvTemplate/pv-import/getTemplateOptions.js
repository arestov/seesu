define(function() {
'use strict';
var templateOptions = function(params, key) {
  this.key = key;
  this.samples = params.map[0];
  this.pv_nest = params.pv_nest;
};

return function getTemplateOptions(params, createKey) {
  if (!params.map[0] || !params.pv_nest) {
    return null;
  }

  return new templateOptions(params, createKey());
};
});
