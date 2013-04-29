
define(['provoda', 'jquery', './coct'], function(provoda, $, coct) {
"use strict";
var YoutubeVideoView = function() {};
coct.PageView.extendTo(YoutubeVideoView, {
	full_page: true,
	createBase: function() {
		this.c = $('<div class="youtube-video-page"></div>');
	},
	'stch-yt_id': function(state) {
		$(this.root_view.create_youtube_video(state)).appendTo(this.c);
	}
});

return YoutubeVideoView;
});