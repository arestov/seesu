define(['provoda', './coct'], function(provoda, coct) {
"use strict";
var LULAPageVIew = function() {};
provoda.View.extendTo(LULAPageVIew, {
	createBase: function() {
		this.c = this.root_view.getSample('lula_page');
		this.createTemplate();
	},
	children_views: {
		all_time: coct.ListPreview
	}

});

var LULAsPageVIew = function() {};
provoda.View.extendTo(LULAsPageVIew, {
	createBase: function() {
		this.c = this.root_view.getSample('lulas_page');
		this.createTemplate();
	}
});

return {
	LULAPageVIew: LULAPageVIew,
	LULAsPageVIew: LULAsPageVIew
};
});