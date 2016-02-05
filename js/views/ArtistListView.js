define(['pv', 'spv', 'View'], function(pv, spv, View) {
"use strict";
var ArtistListView = spv.inh(View, {}, {
	base_tree: {
		sample_name: 'artists_list'
	}
});

return ArtistListView;
});
