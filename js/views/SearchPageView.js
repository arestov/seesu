define(['provoda'],
function(provoda) {
"use strict";
var SearchPageView = function() {};
provoda.View.extendTo(SearchPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('search_results-container');
		this.createTemplate();
	}
});
return SearchPageView;
});
