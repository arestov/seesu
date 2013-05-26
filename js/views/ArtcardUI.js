define(['provoda', 'jquery', './coct'], function(provoda, $, coct) {
"use strict";
var ArtcardUI = function() {};
provoda.View.extendTo(ArtcardUI, {
	die: function() {
		this._super();
	},
	children_views: {
		top_songs: coct.ItemOfLL,
		soundc_prof: coct.ItemOfLL,
		hypem_new: coct.ItemOfLL,
		hypem_fav: coct.ItemOfLL,
		hypem_reblog: coct.ItemOfLL,
		soundc_likes: coct.ItemOfLL,
		similar_artists: coct.ItemOfLL,
		albums_list: coct.AlbumsListPreview,
		dgs_albums: coct.AlbumsListPreview,
		tags_list: coct.TagsListPreview
	},
	state_change: {
		"mp_show": function(opts) {
			this.c.toggleClass('hidden', !opts);
		},
		'selected_image': function(lfm_wrap) {
			if (!lfm_wrap){
				return;
			}
			var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/500/' + lfm_wrap.lfm_id : lfm_wrap.url;
			if (url){
				this.tpl.ancs.bigimagec.empty();
				this.tpl.ancs.bigimagec.append(
					$('<img/>').attr('src', url)
				);
			}
		},

		bio: function(text) {
			if (text){
				var safe_node = document.createElement('div');
				safe_node.innerHTML = text.replace(/([^\n])\n+/gi, '$1<br/><br/>');

				$(safe_node).find('script').remove();

				this.tpl.ancs.bio.empty().append(safe_node);
				this.root_view.bindLfmTextClicks(this.tpl.ancs.bio);
			}
		}
	},
	createBase: function() {
		this.c = this.root_view.getSample('artcard');
		this.createTemplate();
	}
});
return ArtcardUI;
});