
define(['pv', 'jquery', './coct', 'spv'], function(pv, $, coct, spv) {
"use strict";
var YoutubeVideoView = spv.inh(coct.PageView, {}, {
	full_page: true,
	createBase: function() {
		this.c = $('<div class="youtube-video-page"></div>');
	},
	'stch-yt_id': function(target, state) {
		$(target.root_view.create_youtube_video(state)).appendTo(target.c);
	}
});

return YoutubeVideoView;
});
