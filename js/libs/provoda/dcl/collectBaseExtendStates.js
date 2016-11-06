define(function (require) {
'use strict';
var spv = require('spv');

var getUnprefixed = spv.getDeprefixFunc('$ondemand-');
return function collectBaseExtendStates(self) {
	var states_list = [], states_index = {};
	var dclrs_expandable = {};

	for ( var nesting_name in self.dclrs_fpckgs ) {

		if ( getUnprefixed(nesting_name) ) {
			var cur = self.dclrs_fpckgs[ nesting_name ];
			var added = false;

			if (cur.needs_expand_state) {
				var state_name = cur.needs_expand_state;
				if (!states_index[state_name]) {
					states_index[state_name] = true;
					states_list.push( state_name );
				}

				if (!added) {
					if ( !dclrs_expandable[state_name] ) {
						dclrs_expandable[state_name] = [];
					}
					dclrs_expandable[state_name].push( getUnprefixed(nesting_name) );
				}

			}
		}
	}

	if (states_list.length) {
		self.base_tree_expand_states = states_list;
		self.dclrs_expandable = dclrs_expandable;
	}


	//debugger;
};
});
