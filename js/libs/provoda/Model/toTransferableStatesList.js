define(function() {
'use strict'

function toTransferableStatesList(states_raw) {

  var needs_changes, fixed_values;
  var states = states_raw

  for ( var jj = 2; jj < states.length; jj += 3 ) {
    var cur_value = states[jj];
    if (cur_value && typeof cur_value == 'object' && cur_value._provoda_id) {
      needs_changes = true;

      if (!fixed_values) {
        fixed_values = states.slice();
      }

      fixed_values[jj] = {
        _provoda_id: states[jj]._provoda_id
      };
      //fixme, отправляя _provoda_id мы не отправляем модели
      //которые могли попасть в состояния после отправки ПОДДЕЛКИ текущей модели

    }
    //needs_changes
  }

  return needs_changes ? fixed_values : states;

}

return toTransferableStatesList

})
