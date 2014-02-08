define(['spv', 'provoda', 'jquery', './etc_views'], function(spv, provoda, $, etc_views) {
"use strict";
var SoftVkLoginUI = function() {};
etc_views.VkLoginUI.extendTo(SoftVkLoginUI, {
	createBase: function() {
		this._super();
		this.c.removeClass('attention-focuser');
	}
});



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
		this.RPCLegacy('requestPage');
	},
	'stch-list_loading': function(state) {
		this.tpl.ancs.listc.toggleClass('list_loading', !!state);
	},
	'stch-vmp_show': function(state) {
		var node = spv.getTargetField(this, 'tpl.ancs.button_area') || this.c;
		node.toggleClass('button_selected', !!state);
	},
	base_tree: {
		sample_name: 'area_for_button'
	}
});

var ListPreviewLine = function() {};
provoda.View.extendTo(ListPreviewLine, {
	base_tree: {
		sample_name: 'preview_line'
	},
	expandBase: function() {
		this.setVisState('img_allowed', this.extended_viewing);
	},
	'compx-selected_title': {
		depends_on: ['nav_title', 'nav_short_title'],
		fn: function(title, short_title) {
			return short_title || title;
		}
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


var SPView = function() {};
provoda.View.extendTo(SPView, {
	'compx-mp_show_end': {
		depends_on: ['animation_started', 'animation_completed', 'vmp_show'],
		fn: function(animation_started, animation_completed, vmp_show) {
			if (!animation_started){
				return vmp_show;
			} else {
				if (animation_started == animation_completed){
					return vmp_show;
				} else {
					return false;
				}
			}
		}
	}
});

var PageView = function() {};
SPView.extendTo(PageView, {
	'stch-vmp_show': function(state) {
		this.c.toggleClass('hidden', !state);
	},
	createBase: function() {
		this.c = $('<div class="usual_page"></div>');
	}
});






var ArtistsListPreviewLine = function() {};
ListPreviewLine.extendTo(ArtistsListPreviewLine, {
	extended_viewing: true
});

var ListSimplePreview = function() {};
ListPreview.extendTo(ListSimplePreview, {
	children_views: {
		preview_list: ListPreviewLine,
		lists_list: ListPreviewLine,
		auth_block_lfm: etc_views.LfmLoginView,
		auth_block_vk: SoftVkLoginUI
	},
	'stch-pmd_vswitched': function(state) {
		this.c.toggleClass('access-request', state);
	},
	'collch-preview_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	},
	'collch-lists_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	},
	'collch-auth_part': {
		place: 'tpl.ancs.auth_con',
		by_model_name: true
	}
});

var ImagedListPreview = function() {};
ListSimplePreview.extendTo(ImagedListPreview, {
	children_views: {
		preview_list: ArtistsListPreviewLine,
		lists_list: ListPreviewLine,
		auth_block_lfm: etc_views.LfmLoginView,
		auth_block_vk: SoftVkLoginUI
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


var AuthListPreview = function() {};
ImagedListPreview.extendTo(AuthListPreview, {
	base_tree: {
		sample_name: 'preview_area'
	}
});


var ListOfListsView = function() {};
PageView.extendTo(ListOfListsView, {
	createBase: function() {
		this.c = $('<div class="usual_page lilists"></div>');
	},
	children_views: {
		lists_list: AuthListPreview
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
			var node = this.c[0];
			var req = this.root_view.loadImage({
					url: url,
					cache_allowed: true
				}).done(function(){
					node.src = url;
				}).fail(function(){
				});
			this.addRequest(req);
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
	base_tree: {
		sample_name: 'alb_prev_big'
	},

	'stch-selected_image': function(lfm_wrap) {
		var url = lfm_wrap.lfm_id ? 'http://userserve-ak.last.fm/serve/126s/' + lfm_wrap.lfm_id : lfm_wrap.url;
		if (url){
			var node = this.tpl.ancs.imgc[0];
			var req = this.root_view.loadImage({
					url: url,
					cache_allowed: true
				}).done(function(){
					node.src = url;
				}).fail(function(){
				});
			this.addRequest(req);
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
		$(df).append(this.createTagLink(array[i].name));
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
	SPView: SPView,
	PageView:PageView,
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