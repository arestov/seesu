define(['./coct', 'spv'], function(coct, spv) {
"use strict";

var MusicConductorPage = spv.inh(coct.PageView, {}, {
	base_tree: {
		sample_name: 'music_conductor_page'
	}
});

return MusicConductorPage;
});
