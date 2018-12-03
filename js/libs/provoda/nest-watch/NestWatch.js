define(function (require) {
'use strict';
var getShortStateName = require('../utils/getShortStateName');

var counter = 1;
var NestWatch = function(multi_path, state_name, handler, addHandler, removeHandler) {
  var selector = multi_path.nesting.path;
  if (!Array.isArray(selector)) {
    throw new Error('selector should be array');
  }
  if (Array.isArray(state_name)) {
    if (!handler.onchd_count || !handler.onchd_state) {
      throw new Error('should be both onchd_count and onchd_state');
    }
  }
  this.num = counter++;
  this.handled_subl_wtchs = null;

  this.selector = selector;
  this.nmpath_source = multi_path;
  this.state_name = state_name;
  this.short_state_name = state_name &&
    (Array.isArray(state_name)
      ? (state_name.map(getShortStateName))
      : getShortStateName(state_name));
  this.handler = handler; // mainely for 'stch-'

  // this.callback = nwatch.handler; // mainely for 'stch-'
  this.addHandler = addHandler;
  this.removeHandler = removeHandler;

  this.handle_state_change = null;
  this.handle_count_or_order_change = null;

  this.model_groups = null;

  if (!handler && (!addHandler || !removeHandler)) {
    throw new Error('something wrong')
  }

  this.handle_state_change = handler && handler.onchd_state;
  this.handle_count_or_order_change = handler && handler.onchd_count;

};

return NestWatch;
});
