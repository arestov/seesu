define(function (require) {
'use strict';
var stateGetter = require('./stateGetter');
var getter = stateGetter;
return function(item, state_path){
  var getField = getter(state_path);

  if (item._lbr && item._lbr.undetailed_states) {
    return getField(item._lbr.undetailed_states);
  }

  return getField(item.states);
};
});
