

var ArtcardViewInList = function() {};
provoda.View.extendTo(ArtcardViewInList, {
	createBase: function() {
		this.c = $('<li class="artist_in_list"></li>');
		this.alink = $('<span class=""></span>').appendTo(this.c);
		var _this = this;
		this.c.click(function() {
			_this.md.showArtcard();
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
	createBase: function() {
		this.c = this.root_view.getSample('artists_list');
		var _this = this;
		this.generate_button = this.c.find('.to-open-block').click(function() {
			_this.md.requestRandomPlaylist();
		});
		this.listc = this.c.find('ul');
		this.addWayPoint(this.generate_button);
	},

	'stch-mp_show': function(opts) {
		this.c.toggleClass('hidden', !opts);
	},
	'stch-list_loading': function(state){
		this.c.toggleClass('list_loading_state', !!state);
	},
	children_views: {
		artists_list: {
			main: ArtcardViewInList
		}
	},
	'collch-artists_list': 'listc'
});


var artCardUI = function() {};
provoda.View.extendTo(artCardUI, {
	die: function() {
		this._super();
	},
	children_views: {
		top_songs: ItemOfLL,
		soundc_prof: ItemOfLL,
		hypem_new: ItemOfLL,
		hypem_fav: ItemOfLL,
		hypem_reblog: ItemOfLL,
		soundc_likes: ItemOfLL,
		similar_artists: ItemOfLL,
		albums_list: AlbumsListPreview,
		dgs_albums: AlbumsListPreview,
		tags_list: TagsListPreview
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
