define(['pv', 'spv'], function(pv, spv) {
"use strict";

var ArtistListView = spv.inh(pv.View, {}, {
	base_tree: {
		sample_name: 'artists_list'
	}
});

return ArtistListView;
});
