var AlbumsListPreviewItem = function() {};
provoda.View.extendTo(AlbumsListPreviewItem, {
	createBase: function() {
		this.c = $('<img class="album_preview" src=""/>');
	},
	'stch-selected-image': function(lfm_wrap) {
		var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/64s/' + lfm_wrap.lfm_id : lfm_wrap.url;
		this.c.attr('src', url);
	}
});


var BigAlbumPreview = function() {};
provoda.View.extendTo(BigAlbumPreview, {
	createBase: function() {
		this.c = this.root_view.getSample('alb_prev_big');
		this.ancs = this.root_view.getPvAnchors(this.c);
		var _this = this;

		this.c.click(function() {
			_this.md.showOnMap();
			return false;
		});
		this.addWayPoint(this.c);
	},
	'stch-can-hide-artist-name': function(state) {
		this.ancs.artist_name_c.toggleClass('hidden', state);
	},
	'stch-album_name': function(state) {
		this.c.attr('title', state);
		this.ancs.album_name_c.text(state);
	},
	'stch-album_artist': function(state) {
		this.ancs.artist_name_c.text(state);
	},
	'stch-selected-image': function(lfm_wrap) {
		var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/126s/' + lfm_wrap.lfm_id : lfm_wrap.url;
		this.ancs.imgc.attr('src', url);
	}
});

var AlbumsListView = function() {};
PageView.extendTo(AlbumsListView, {
	createBase: function() {
		this.c = this.root_view.getSample('albums_page');
		this.ancs = this.root_view.getPvAnchors(this.c);
		
		var _this = this;
		this.ancs.load_m_b.click(function() {
			_this.md.requestMoreData();
			return false;
		});
	},
	children_views: {
		preview_list: BigAlbumPreview
	},
	'collch-preview_list': 'ancs.albums_list_c',
	'stch-more_load_available': function(state) {
		this.ancs.load_m_b.toggleClass('hidden', !state);
	}
});

var AlbumsListPreview = function() {};
ItemOfLL.extendTo(AlbumsListPreview, {
	createBase: function() {
		this._super();
		this.ancs.listc.addClass('albums_previews');
	},
	children_views: {
		preview_list: AlbumsListPreviewItem
	},
	'collch-preview_list': {
		place: 'ancs.listc',
		limit: 15
	}
});

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
	'stch-artist-name': function(state) {
		this.alink.text(state);
	},
	'stch-selected-image': function(lfm_wrap) {
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

	'stch-mp-show': function(opts) {
		this.c.toggleClass('hidden', !opts);
	},
	'stch-list-loading': function(state){
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
		top_songs: {
			main: ItemOfLL
		},
		similar_artists: {
			main: ItemOfLL
		},
		albums_list: {
			main: AlbumsListPreview
		}
	},
	state_change: {
		"mp-show": function(opts) {
			this.c.toggleClass('hidden', !opts);
		},
		"loading-baseinfo": function(state) {
			var mark_loading_nodes = this.ui.tagsc.add(this.ui.bioc);

			if (state){
				mark_loading_nodes.addClass('loading');
			} else {
				mark_loading_nodes.removeClass('loading');
			}
		},
		'selected-image': function(lfm_wrap) {
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
		tags: function(tags) {
			var list_c = this.ui.tagsc.children('.links-list');
			var _this = this;
			$.each(tags, function(i, el){
				if (el && el.name){
					//var li = $('<li></li>');
					var a = $('<a class="js-serv"></a>').click(function(){
						su.show_tag(el.name);
					}).text(el.name).attr('url', el.url).appendTo(list_c);
					_this.addWayPoint(a);
				//	li.appendTo(ul);
					list_c.append(document.createTextNode(' '));
				}
				
			});
			list_c.removeClass('hidden');
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
			tagsc: this.c.find('.art_card-tags'),
			bioc: this.c.find('.art_card-bio')
		};

		this.ancs = this.root_view.getPvAnchors(this.c);

		
	}
});
