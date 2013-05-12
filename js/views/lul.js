define(['provoda'], function(provoda) {
"use strict";
var LULAsPageVIew = function() {};
provoda.View.extendTo(LULAsPageVIew, {
	createBase: function() {
		this.c = this.root_view.getSample('lulas_page');
		this.createTemplate();
	}
});

return {
	LULAsPageVIew: LULAsPageVIew
};
});