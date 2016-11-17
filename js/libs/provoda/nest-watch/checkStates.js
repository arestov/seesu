define(function (require) {
'use strict';
var orderItems = require('./orderItems');

return function (etr, zdsv, state_name, value, cur_value) {
  var links = etr.states_links && etr.states_links[state_name];
  if (!links) {return;}
  for (var k = 0; k < links.length; k++) {
    var cur = links[k];
    // var calls_flow = (opts && opts.emergency) ? main_calls_flow : this.sputnik._getCallsFlow();
    var calls_flow = etr._getCallsFlow();
    calls_flow.pushToFlow(null, cur, [state_name, value, cur_value, etr], null, handleStates, null, etr.current_motivator);

  }
};

function handleStates(motivator, _, lnwatch, args) {
  orderItems(lnwatch);
  lnwatch.state_handler.call(null, motivator, _, lnwatch, args);
}
});
