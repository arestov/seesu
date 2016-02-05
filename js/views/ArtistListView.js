define(['pv', 'spv'], function(pv, spv) {
"use strict";
var View = pv.View;
var ArtistListView = spv.inh(View, {}, {
	base_tree: {
		sample_name: 'artists_list'
	}
});

return ArtistListView;
});
