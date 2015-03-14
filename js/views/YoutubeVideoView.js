
define(['pv', 'jquery', './coct'], function(pv, $, coct) {
"use strict";
var YoutubeVideoView = function() {};
coct.PageView.extendTo(YoutubeVideoView, {
	full_page: true,
	createBase: function() {
		this.c = $('<div class="youtube-video-page"></div>');
	},
	'stch-yt_id': function(target, state) {
		$(this.root_view.create_youtube_video(state)).appendTo(this.c);
	}
});

return YoutubeVideoView;
});
