define(['provoda'], function(provoda) {
"use strict";

var baseNavUI = function() {};

provoda.View.extendTo( baseNavUI, {
	dom_rp: true,
	createBase: function() {
		this.useBase(this.root_view.getSample('common-nav'));
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

