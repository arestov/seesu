define(function(require) {
'use strict';
var BrowseMap = require('js/libs/BrowseMap');
var app_serv = require('app_serv');
var pv = require('pv');
var spv = require('spv');

var pvUpdate = pv.update;
var app_env = app_serv.app_env;
var YoutubeVideo = spv.inh(BrowseMap.Model, {
	init: function(target, opts, params) {
		target.mo = target.map_parent.mo;
		target.map_parent = target.map_parent.map_parent;//hack, fixme


		pvUpdate(target, 'yt_id', params.yt_id);

		pvUpdate(target, 'cant_show', params.cant_show);
		pvUpdate(target, 'previews', params.previews);

		pvUpdate(target, 'nav_title', params.title);
		pvUpdate(target, 'url_part', '/youtube/' + params.yt_id);
	}
}, {
	model_name: 'youtube_video',
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
