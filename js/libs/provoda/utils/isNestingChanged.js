define(function(require) {
'use strict';

return function isNestingChanged(old_value, new_value) {
  if (!Array.isArray(old_value) || !Array.isArray(new_value)) {
    return old_value != new_value
  }

  if (old_value.length != new_value.length) {
    return true
  }

  for (var i = 0; i < old_value.length; i++) {
    if (old_value[i] != new_value) {
      return true
    }

  }


  return false;
}
})
