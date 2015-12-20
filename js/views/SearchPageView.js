define(['pv', 'spv'], function(pv, spv) {
"use strict";
var SearchPageView = spv.inh(pv.View, {}, {
	base_tree: {
		sample_name: 'search_results-container'
	}
});
return SearchPageView;
});
