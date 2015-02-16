define(['pv'],
function(pv) {
"use strict";
var SearchPageView = function() {};
pv.View.extendTo(SearchPageView, {
	base_tree: {
		sample_name: 'search_results-container'
	}
});
return SearchPageView;
});
