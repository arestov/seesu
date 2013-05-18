define(['spv', 'provoda', 'jquery'], function(spv, provoda, $) {
"use strict";

var ListPreview = function() {};
provoda.View.extendTo(ListPreview, {
	useBase: function(node) {
		this.c = node;
		this.bindBase();
	},
	bindBase: function() {
		this.createTemplate();
		var _this = this;
		var button_area = spv.getTargetField(this, 'tpl.ancs.button_area') || this.c;
		button_area.click(function() {
			_this.clickAction.call(_this);
		});

		this.addWayPoint(button_area);
	},
	clickAction: function() {
		this.RPCLegacy('showOnMap');
	},
	'stch-list_loading': function(state) {
		this.tpl.ancs.listc.toggleClass('list_loading', !!state);
	},
	createBase: function() {
		this.c = this.root_view.getSample('area_for_button');
		this.bindBase();
	}
});

var ListPreviewLine = function() {};
provoda.View.extendTo(ListPreviewLine, {
	createBase: function() {
		this.c = $('<span class="desc_item"></span>');
		if (this.extended_viewing){
			this.image_c = $('<span class="desc_item-imgcon"></span>').appendTo(this.c);
		}
		
		this.text_c = $('<span class="desc_item-text"></span>').appendTo(this.c);

	},
	'compx-selected_title': {
		depends_on: ['nav_title', 'nav-short-title'],
		fn: function(title, short_title) {
			return short_title || title;
		}
	},
	'stch-selected_title': function(state) {
		this.text_c.text(state);
	}
});


var LiListsPreview = function() {};
ListPreview.extendTo(LiListsPreview, {
	createBase: function() {
		this._super();
		this.c.addClass('tag_artists-preview');
	},
	children_views: {
		lists_list: ListPreviewLine
	},
	'collch-lists_list': 'tpl.ancs.listc'
});



var PageView = function() {};
provoda.View.extendTo(PageView, {
	'stch-mp_show': function(state) {
		this.c.toggleClass('hidden', !state);
	},
	createBase: function() {
		this.c = $('<div class="usual_page"></div>');
	}
});

var AllPlacesPage = function() {};
PageView.extendTo(AllPlacesPage, {
	children_views: {
		songs_lists: LiListsPreview,
		artists_lists: LiListsPreview
	},
	'collch-songs_lists': 'c',
	'collch-artists_lists': 'c'

});






var ArtistsListPreviewLine = function() {};
ListPreviewLine.extendTo(ArtistsListPreviewLine, {
	extended_viewing: true,
	'stch-selected_image': function(lfm_wrap) {
		if (!lfm_wrap){
			return;
		}
		var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/64s/' + lfm_wrap.lfm_id : lfm_wrap.url;


		if (url){
			this.image_c.empty();
			this.image_c.append(
				$('<img/>').attr({
					'src': url,
					alt: this.state('artist')
				})
			);
		}
	}
});

var ListSimplePreview = function() {};
ListPreview.extendTo(ListSimplePreview, {
	children_views: {
		preview_list: ListPreviewLine,
		lists_list: ListPreviewLine
	},
	'collch-preview_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	},
	'collch-lists_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	}
});

var ImagedListPreview = function() {};
ListSimplePreview.extendTo(ImagedListPreview, {
	children_views: {
		preview_list: ArtistsListPreviewLine,
		lists_list: ListPreviewLine
	}
});

var ItemOfLL = function() {};
ListPreview.extendTo(ItemOfLL, {
	children_views: {
		preview_list: ArtistsListPreviewLine,
		lists_list: ListPreviewLine
	},
	'collch-preview_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	},
	'collch-lists_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	}
});

var ListOfListsView = function() {};
PageView.extendTo(ListOfListsView, {
	createBase: function() {
		this.c = $('<div class="usual_page lilists"></div>');
	},
	children_views: {
		lists_list: ItemOfLL
	},
	'collch-lists_list': 'c'
});




var AlbumsListPreviewItem = function() {};
provoda.View.extendTo(AlbumsListPreviewItem, {
	createBase: function() {
		this.c = $('<img class="album_preview" src=""/>');
	},
	'stch-selected_image': function(lfm_wrap) {
		var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/126s/' + lfm_wrap.lfm_id : lfm_wrap.url;
		if (url){
			var req = this.root_view.loadImage({
					node: this.c[0],
					url: url,
					cache_allowed: true
				}).done(function(){
				}).fail(function(){
				});
			this.on('die', function() {
				req.abort();
			});
		} else {
			this.c.attr('src', '');
		}
	}
});


var BigAlbumPreview = function() {};
provoda.View.extendTo(BigAlbumPreview, {
	createBase: function() {
		this.c = this.root_view.getSample('alb_prev_big');
		this.createTemplate();
		var _this = this;

		this.c.click(function() {
			_this.RPCLegacy('showOnMap');
			return false;
		});
		this.addWayPoint(this.c);
	},
	'stch-can-hide-artist_name': function(state) {
		this.tpl.ancs.artist_name_c.toggleClass('hidden', state);
	},
	'stch-album_name': function(state) {
		this.c.attr('title', state);
		this.tpl.ancs.album_name_c.text(state);
	},
	'stch-album_artist': function(state) {
		this.tpl.ancs.artist_name_c.text(state);
	},
	'stch-selected_image': function(lfm_wrap) {
		var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/126s/' + lfm_wrap.lfm_id : lfm_wrap.url;
		if (url){
			var req = this.root_view.loadImage({
					node: this.tpl.ancs.imgc[0],
					url: url,
					cache_allowed: true
				}).done(function(){
				}).fail(function(){
				});
			this.on('die', function() {
				req.abort();
			});
		} else {
			this.tpl.ancs.imgc.attr('src', '');
		}
	}
});

var AlbumsListView = function() {};
PageView.extendTo(AlbumsListView, {
	createBase: function() {
		this.c = this.root_view.getSample('albums_page');
		this.createTemplate();
		
		var _this = this;
		this.tpl.ancs.load_m_b.click(function() {
			_this.RPCLegacy('requestMoreData');
			return false;
		});
	},
	children_views: {
		preview_list: BigAlbumPreview
	},
	'collch-preview_list': 'tpl.ancs.albums_list_c',
	'stch-more_load_available': function(state) {
		this.tpl.ancs.load_m_b.toggleClass('hidden', !state);
	}
});

var AlbumsListPreview = function() {};
ItemOfLL.extendTo(AlbumsListPreview, {
	createBase: function() {
		this._super();
		this.tpl.ancs.listc.addClass('albums_previews');
	},
	children_views: {
		preview_list: AlbumsListPreviewItem
	},
	'collch-preview_list': {
		place: 'tpl.ancs.listc',
		limit: 15
	}
});


var tagListChange = function(array) {
	this.tpl.ancs.listc.empty();
	var df = document.createDocumentFragment();
	for (var i = 0; i < array.length; i++) {
		$(df).append(this.createTagLink(array[i]));
		$(df).append(document.createTextNode(" "));
	}
	this.tpl.ancs.listc.append(df);
};
var TagsListPreview = function() {};
ListPreview.extendTo(TagsListPreview, {
	'stch-data-list': tagListChange,
	createTagLink: function(name) {
		return $('<span></span>').text(name);
	}
});




return {
	ListPreview:ListPreview,
	LiListsPreview:LiListsPreview,
	ListPreviewLine:ListPreviewLine,
	PageView:PageView,
	AllPlacesPage:AllPlacesPage,
	ArtistsListPreviewLine: ArtistsListPreviewLine,
	ItemOfLL:ItemOfLL,
	ListOfListsView:ListOfListsView,
	AlbumsListPreviewItem:AlbumsListPreviewItem,
	BigAlbumPreview:BigAlbumPreview,
	AlbumsListView:AlbumsListView,
	AlbumsListPreview:AlbumsListPreview,
	TagsListPreview: TagsListPreview,
	ListSimplePreview: ListSimplePreview,
	ImagedListPreview: ImagedListPreview
};

});