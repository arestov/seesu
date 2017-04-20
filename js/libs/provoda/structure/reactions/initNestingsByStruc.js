define(function (require) {
'use strict';

var hp = require('../../helpers');
var initDeclaredNestings = require('../../initDeclaredNestings');
var getSubpages = initDeclaredNestings.getSubpages;

return function initNestingsByStruc(md, struc) {
	if (!struc) {return;}

	var idx = md.idx_nestings_declarations;
	if (!idx) {return;}

	var obj = struc.main.m_children.children;
	for (var name in obj) {
		var nesting_name = hp.getRightNestingName(md, name);
		var el = idx[nesting_name];
		if (!el) {continue;}
		if (el.init_state_name && (el.init_state_name !== 'mp_show' && el.init_state_name !== 'mp_has_focus')) {
			continue;
		}
		if (md.getNesting(el.nesting_name)) {
			continue;
		}
		md.updateNesting(el.nesting_name, getSubpages( md, el ));
	}
}

});
