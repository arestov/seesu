define(function(require){
'use strict';

var spv = require('spv');
var hp = require('../helpers');

var getUnprefixed = spv.getDeprefixFunc( 'state-' );
var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

return function(self, props) {
  if (!hasPrefixedProps(props)){
    return;
  }
  var prop;

  var build_index = self._build_cache_interfaces;
  self._build_cache_interfaces = {};

  self._interfaces_to_states_index = {};

  var all_states_instrs = [];
  for (prop in self) {
    var state_name = getUnprefixed(prop);
    if (!state_name) {continue;}
    var item;
    if (props.hasOwnProperty(prop)) {
      var cur = self[prop];
      item = cur && {
        state_name: state_name,
        interface_name: cur[0],
        fn: cur[1]
      };

    } else {
      item = build_index[state_name];
    }
    self._build_cache_interfaces[state_name] = item;
    all_states_instrs.push(item);

  }
  self._interfaces_to_states_index = spv.makeIndexByField(all_states_instrs, 'interface_name', true);
};
});
