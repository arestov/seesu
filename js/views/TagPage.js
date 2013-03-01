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

var ListPreview = function() {};
provoda.View.extendTo(ListPreview, {
	useBase: function(node) {
		this.c = node;
		this.bindBase();
	},
	bindBase: function() {
		this.createTemplate();
		var _this = this;
		this.c.click(function() {
			_this.md.showOnMap();
		});

		this.addWayPoint(this.c);
	},
	createBase: function() {
		this.c = this.root_view.getSample('area_for_button');
		this.bindBase();
	}
});


var ItemOfLL = function() {};
ListPreview.extendTo(ItemOfLL, {
	
	'stch-list_loading': function(state) {
		this.tpl.ancs.listc.toggleClass('list_loading', !!state);
	},
	children_views: {
		preview_list: ArtistsListPreviewLine
	},
	'collch-preview_list': {
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

var TagPageView = function() {};
PageView.extendTo(TagPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('tag_page');
		this.createTemplate();
	},
	children_views: {
		artists_lists: LiListsPreview,
		songs_list: LiListsPreview
	}
});