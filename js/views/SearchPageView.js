define(['provoda'],
function(provoda) {
"use strict";
var SearchPageView = function() {};
provoda.View.extendTo(SearchPageView, {
	base_tree: {
		sample_name: 'search_results-container'
	}
});
return SearchPageView;
});
