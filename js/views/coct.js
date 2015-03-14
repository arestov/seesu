define(['spv', 'pv', 'jquery', './etc_views'], function(spv, pv, $, etc_views) {
"use strict";
var SoftVkLoginUI = function() {};
etc_views.VkLoginUI.extendTo(SoftVkLoginUI, {
	createBase: function() {
		this._super();
		this.c.removeClass('attention-focuser');
	}
});



var ListPreview = function() {};
pv.View.extendTo(ListPreview, {
	useBase: function(node) {
		this.c = node;
		this.bindBase();
	},
	bindBase: function() {
		this.createTemplate();
		var _this = this;
		var button_area = spv.getTargetField(this, 'tpl.ancs.button_area') || this.c;
		button_area.click(function() {
			_this.requestPage();
		});

		this.addWayPoint(button_area);
	},
	'stch-list_loading': function(target, state) {
		if (!this.tpl.ancs.listc) {
			return;
		}
		this.tpl.ancs.listc.toggleClass('list_loading', !!state);
	},
	'stch-mp_show': function(target, state) {
		var node = spv.getTargetField(this, 'tpl.ancs.button_area') || this.c;
		node.toggleClass('button_selected', !!state);
	},
	base_tree: {
		sample_name: 'area_for_button'
	}
});

var ListPreviewLine = function() {};
pv.View.extendTo(ListPreviewLine, {
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
pv.View.extendTo(SPView, {
	'compx-lvmp_show': [
		['^vmp_show'],
		function(vmp_show) {
			return vmp_show;
		}
	],
	'compx-mp_show_end': {
		depends_on: ['^mp_show_end'],
		fn: function(mp_show_end) {
			return mp_show_end;
		}
	}
});

var PageView = function() {};
SPView.extendTo(PageView, {
	'stch-vmp_show': function(target, state) {
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
		preview_list: ListPreviewLine
		
	},
	children_views_by_mn: {
		auth_part: {
			auth_block_lfm: etc_views.LfmLoginView,
			auth_block_vk: SoftVkLoginUI
		}
	},
	'stch-pmd_vswitched': function(target, state) {
		this.c.toggleClass('access-request', state);
	},
	'collch-preview_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	},
/*	'collch-lists_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	},*/
	'collch-auth_part': {
		place: 'tpl.ancs.auth_con',
		by_model_name: true
	}
});

var ImagedListPreview = function() {};
ListSimplePreview.extendTo(ImagedListPreview, {
	children_views: {
		preview_list: ArtistsListPreviewLine
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
/*	'collch-lists_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	}*/
});


var AuthListPreview = function() {};
ImagedListPreview.extendTo(AuthListPreview, {
	base_tree: {
		sample_name: 'preview_area'
	}
});


var SimpleListOfListsView = function() {};
PageView.extendTo(SimpleListOfListsView, {
	base_tree: {
		sample_name: 'lilists'
	},
	children_views: {
		lists_list: ListSimplePreview
	},
	'collch-lists_list': 'tpl.ancs.lilists_con'
});

var ListOfListsView = function() {};
PageView.extendTo(ListOfListsView, {
	base_tree: {
		sample_name: 'lilists'
	},
	children_views: {
		lists_list: AuthListPreview
	},
	'collch-lists_list': 'tpl.ancs.lilists_con'
});




var AlbumsListPreviewItem = function() {};
pv.View.extendTo(AlbumsListPreviewItem, {
	createBase: function() {
		this.c = $('<img class="album_preview" src=""/>');
	},
	'stch-selected_image': function(target, lfm_wrap) {
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
pv.View.extendTo(BigAlbumPreview, {
	base_tree: {
		sample_name: 'alb_prev_big'
	},

	'stch-selected_image': function(target, lfm_wrap) {
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
	base_tree: {
		sample_name: 'albums_page'
	},
	children_views: {
		preview_list: BigAlbumPreview
	},
	'collch-preview_list': 'tpl.ancs.albums_list_c'

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
	'stch-simple_tags_list': tagListChange,
	createTagLink: function(name) {
		return $('<span></span>').text(name);
	}
});



var VKPostsView = function() {};
PageView.extendTo(VKPostsView, {
	base_tree: {
		sample_name: 'vk_posts_page'
	}
});

var AppNewsView = function() {};
PageView.extendTo(AppNewsView, {
	base_tree: {
		sample_name: 'app-news'
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
	SimpleListOfListsView: SimpleListOfListsView,
	ListOfListsView:ListOfListsView,
	AlbumsListPreviewItem:AlbumsListPreviewItem,
	BigAlbumPreview:BigAlbumPreview,
	AlbumsListView:AlbumsListView,
	AlbumsListPreview:AlbumsListPreview,
	TagsListPreview: TagsListPreview,
	ListSimplePreview: ListSimplePreview,
	ImagedListPreview: ImagedListPreview,
	VKPostsView: VKPostsView,
	AppNewsView: AppNewsView
};

});