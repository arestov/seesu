define(['pv', 'spv', 'View'], function(pv, spv, View) {
"use strict";
var SearchPageView = spv.inh(View, {}, {
	base_tree: {
		sample_name: 'search_results-container'
	}
});
return SearchPageView;
});
