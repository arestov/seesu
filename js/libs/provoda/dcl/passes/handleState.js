define(function(require) {
'use strict'
// etr, original_states, state_name, value
return function(self, original_states, state_name, value) {
  if (!self.__handleState || !self.__handleState[state_name]) {
    return
  }

  var pass_name = self.__handleState[state_name]

  var old_value = original_states[state_name];
  var arg = {
    value: value,
    old_value: old_value,
  }

  self.nextLocalTick(self.__act, [self, pass_name, arg], true);
}
})
