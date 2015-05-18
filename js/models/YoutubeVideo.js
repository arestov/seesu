define(['js/libs/BrowseMap', 'app_serv', 'pv'],function(BrowseMap, app_serv, pv) {
"use strict";
var pvUpdate = pv.update;
var app_env = app_serv.app_env;
var YoutubeVideo = function() {};
BrowseMap.Model.extendTo(YoutubeVideo, {
	model_name: 'youtube_video',
	init: function(opts, params) {
		//this.map_parent = opts.map_parent.map_parent;

		//opts.map_parent = opts.map_parent
		this._super.apply(this, arguments);
		this.mo = this.map_parent.mo;
		this.map_parent = this.map_parent.map_parent;//hack, fixme

		
		pvUpdate(this, 'yt_id', params.yt_id);

		pvUpdate(this, 'cant_show', params.cant_show);
		pvUpdate(this, 'previews', params.previews);

		pvUpdate(this, 'nav_title', params.title);
		pvUpdate(this, 'url_part', '/youtube/' + params.yt_id);
	},
	'stch-mp_has_focus': function(target, state) {
		if (state) {
			target.app.trackEvent('Navigation', 'youtube video');
			target.map_parent.pause();
		}
	},
	'compx-triple': [
		['previews'],
		function(previews) {
			if (previews && previews.start && previews.middle &&  previews.end) {
				return [previews.start, previews.middle, previews.end];
				// return previews;
			}
		}
	],
	full_page_need: true,
	requestVideo: function() {
		var cant_show = this.state('cant_show');
		var link = 'http://www.youtube.com/watch?v=' + this.state('yt_id');
		if (!cant_show && !app_env.tizen_app){
			this.showOnMap();
			
		} else{
			app_env.openURL(link);
		}
	}
});


return YoutubeVideo;
});
