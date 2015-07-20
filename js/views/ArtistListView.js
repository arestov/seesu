define(['pv', 'jquery'], function(pv) {
"use strict";

var ArtistListView = function() {};
pv.View.extendTo(ArtistListView, {
	base_tree: {
		sample_name: 'artists_list'
	}
});

return ArtistListView;
});
