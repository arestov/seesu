define(['pv', 'spv'], function(pv, spv) {
"use strict";
var View = pv.View;
var SearchPageView = spv.inh(View, {}, {
	base_tree: {
		sample_name: 'search_results-container'
	}
});
return SearchPageView;
});
