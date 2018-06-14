define(function (require) {
'use strict';
var getShortStateName = require('../utils/getShortStateName');

var standart = require('./standartNWH');

var wrapper = standart(function wrapper(md, items, lnwatch) {
  var callback = lnwatch.nwatch.handler;
  callback(md, null, null, {
    items: items,
    item: null
  });
});


var stateHandler = standart(function baseStateHandler(md, items, lnwatch, args) {
  if (!args.length) {return;}
  var callback = lnwatch.nwatch.handler;
  callback(md, args[1], args[2], {
    items: items,
    item: args[3]
  });
});

var counter = 1;
var NestWatch = function(nesting_source, state_name, handler, addHandler, removeHandler) {
  var selector = nesting_source.selector;
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
  this.start_point = nesting_source.start_point || null;
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


  if (handler && (Array.isArray(state_name) || typeof handler == 'object')) {
    this.handle_state_change = handler.onchd_state;
    this.handle_count_or_order_change = handler.onchd_count;
  } else {
    // просто передать массив в пользовательскую функцию

    if (!this.handler && (!addHandler || !removeHandler)) {
      throw new Error('something wrong')
    }

    this.handle_state_change = (this.handler && stateHandler)
    this.handle_count_or_order_change = (this.handler && wrapper)
  }

};

return NestWatch;
});
