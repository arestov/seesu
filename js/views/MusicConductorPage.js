define(function(require) {
'use strict';
var coct = require('./coct');
var spv = require('spv');

var MusicConductorPage = spv.inh(coct.PageView, {}, {
	base_tree: {
		sample_name: 'music_conductor_page'
	}
});

return MusicConductorPage;
});
