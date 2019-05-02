define(function(require) {
'use strict'
// etr, original_states, state_name, value
return function(self, state_name, old_value, value) {
  if (!self.__handleNesting || !self.__handleNesting[state_name]) {
    return
  }

  var pass_name = self.__handleNesting[state_name].name

  var arg = {
    next_value: value,
    prev_value: old_value,
  }

  self.nextLocalTick(self.__act, [self, pass_name, arg], true);
}
})
