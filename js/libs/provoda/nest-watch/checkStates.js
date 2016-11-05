define(function (require) {
'use strict';
return function (etr, zdsv, state_name, value, cur_value) {
  var links = etr.states_links && etr.states_links[state_name];
  if (!links) {return;}
  for (var k = 0; k < links.length; k++) {
    var cur = links[k];
    // var calls_flow = (opts && opts.emergency) ? main_calls_flow : this.sputnik._getCallsFlow();
    var calls_flow = etr._getCallsFlow();
    calls_flow.pushToFlow(null, cur, [state_name, value, cur_value, etr], null, cur.state_handler, null, etr.current_motivator);

  }
};

});
