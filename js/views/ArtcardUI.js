
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
		"loading_baseinfo": function(state) {
			var mark_loading_nodes = this.ui.bioc;

			if (state){
				mark_loading_nodes.addClass('loading');
			} else {
				mark_loading_nodes.removeClass('loading');
			}
		},
		'selected_image': function(lfm_wrap) {
			if (!lfm_wrap){
				return;
			}
			var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/500/' + lfm_wrap.lfm_id : lfm_wrap.url;


			if (url){
				this.ui.imagec.empty();
				this.ui.imagec.append(
					$('<img/>').attr('src', url)
				);
			}
		},

		bio: function(text) {

			if (text){
				var safe_node = document.createElement('div');
				safe_node.innerHTML = text.replace(/([^\n])\n+/gi, '$1<br/><br/>');

				$(safe_node).find('script').remove();

				this.ui.bioc.empty().append(safe_node);
			//	this.ui.bioc.html(text.replace(/[^^]\n+/gi, '<br/><br/>'));
				this.root_view.bindLfmTextClicks(this.ui.bioc);
			}
		}

	},
	createBase: function() {
		var _this = this;
		this.c = this.root_view.getSample('artcard');
		this.ui = {
			imagec: this.c.find('.art_card-image .art_card-image-padding'),
			bioc: this.c.find('.art_card-bio')
		};
		this.createTemplate();

		
	}
});
return ArtcardUI;
});