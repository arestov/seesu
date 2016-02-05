define(['pv', 'spv', 'View'], function(pv, spv, View) {
"use strict";
var baseNavUI = spv.inh(View, {}, {
	dom_rp: true,
	base_tree: {
		sample_name: 'common-nav'
	},

	'compx-nav_clickable':{
		depends_on: ['mp_stack', 'mp_has_focus'],
		fn : function(mp_stack, mp_has_focus) {
			return !mp_has_focus && ((mp_stack == Boolean(mp_stack)) || mp_stack == 'top');
		}
	},
	tpl_events:{
		zoomOut: function() {
			if (this.state('nav_clickable')){
				this.parent_view.RPCLegacy('zoomOut');
			}
		}
	}
});

var StartPageNavView = spv.inh(baseNavUI, {}, {
	base_tree: {
		sample_name: 'start_page-nav'
	}
});

var investgNavUI = spv.inh(baseNavUI, {}, {
	base_tree: {
		sample_name: 'search_page-nav'
	}
});

return {
	baseNavUI:baseNavUI,
	StartPageNavView:StartPageNavView,
	investgNavUI:investgNavUI
};
});

