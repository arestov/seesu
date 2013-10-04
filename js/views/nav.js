define(['provoda'], function(provoda) {
"use strict";

var baseNavUI = function() {};

provoda.View.extendTo( baseNavUI, {
	dom_rp: true,
	createBase: function() {
		this.useBase(this.root_view.getSample('common-nav'));
	},
	'compx-nav_clickable':{
		depends_on: ['mp_stack'],
		fn : function(mp_stack) {
			return (mp_stack == !!mp_stack) || mp_stack == 'top';
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
	createBase: function(){
		this.useBase(this.root_view.getSample('start_page-nav'));
	}
});

var investgNavUI = function() {};
baseNavUI.extendTo(investgNavUI, {
	createBase: function() {
		this.useBase(this.root_view.getSample('search_page-nav'));
	}
});

return {
	baseNavUI:baseNavUI,
	StartPageNavView:StartPageNavView,
	investgNavUI:investgNavUI
};
});

