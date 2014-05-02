define(['provoda'], function(provoda) {
"use strict";

var baseNavUI = function() {};

provoda.View.extendTo( baseNavUI, {
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
				this.RPCLegacy('zoomOut');
			}
		}
	}
});

var StartPageNavView = function() {};
baseNavUI.extendTo(StartPageNavView, {
	base_tree: {
		sample_name: 'start_page-nav'
	}
});

var investgNavUI = function() {};
baseNavUI.extendTo(investgNavUI, {
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

