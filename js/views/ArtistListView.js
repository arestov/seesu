define(['provoda', 'jquery'], function(provoda, $) {
"use strict";


var ArtcardViewInList = function() {};
provoda.View.extendTo(ArtcardViewInList, {
	createBase: function() {
		this.c = $('<li class="artist_in_list"></li>');
		this.alink = $('<span class=""></span>').appendTo(this.c);
		var _this = this;
		this.c.click(function() {
			_this.RPCLegacy('showArtcard');
			//_this.RPCLegacy('showArtcard');
			return false;
		});
		this.image_place = $('<span class="song-image-con"></span>').appendTo(this.c);
		this.addWayPoint(this.c);
	},
	'stch-artist_name': function(state) {
		this.alink.text(state);
	},
	'stch-selected_image': function(lfm_wrap) {
		if (!lfm_wrap){
			return;
		}
		var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/64s/' + lfm_wrap.lfm_id : lfm_wrap.url;


		if (url){
			this.image_place.empty();
			this.image_place.append(
				$('<img/>').attr('src', url)
			);
		}
	}
});


var ArtistListView = function() {};
provoda.View.extendTo(ArtistListView, {
	base_tree: {
		sample_name: 'artists_list'
	},
	children_views: {
		artists_list: {
			main: ArtcardViewInList
		}
	},
	'collch-artists_list': 'tpl.ancs.listc'
});

return ArtistListView;
});
