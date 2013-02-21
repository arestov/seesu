

var ArtistsListPreviewLine = function() {};
provoda.View.extendTo(ArtistsListPreviewLine, {
	createBase: function() {
		this.c = $('<span></span>');
	},
	'stch-nav-title': function(state) {
		this.c.text(state);
	}
});


var ItemOfLL = function() {};
provoda.View.extendTo(ItemOfLL, {
	createBase: function() {
		this.c = $('<div class="area-button"></div>');
		var _this = this;
		this.c.click(function() {
			_this.md.showOnMap();
		});
		this.addWayPoint(this.c);
	},
	'stch-nav-title': function(state) {
		this.c.text(state);
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
provoda.View.extendTo(LiListsPreview, {
	createBase: function() {
		this.c = $('<div class="tag_artists-preview area_for_button"></div>');
		var _this = this;
		this.big_button = $('<div class="area-button"></div>').appendTo(this.c);
		this.big_button.click(function() {
			_this.md.showOnMap();
		});
		this.addWayPoint(this.big_button);
		this.header = $('<span></span>').appendTo(this.big_button);
		this.listc = $('<div class="area-description desc"></div>').appendTo(this.c);
	},
	'stch-nav-title': function(state) {
		this.header.text(state);
	},
	children_views: {
		lists_list: ArtistsListPreviewLine
	},
	'collch-lists_list': 'listc'
});

var TagPageView = function() {};
PageView.extendTo(TagPageView, {
	createBase: function() {
		this.c = $('<div class="tag_page usual_page"></div>');
		this.header = $('<h2></h2>').appendTo(this.c);
		this.artists_c = $('<div class="artists_lists"></div>').appendTo(this.c);
		this.songs_c = $('<div class="songs_list"></div>').appendTo(this.c);
	},
	'stch-tag-name': function(state) {
		this.header.text(state);
	},
	children_views: {
		artists_lists: {
			main: LiListsPreview
		},
		songs_list: {
			main: LiListsPreview
		}
	},
	'collch-songs_list': 'songs_c',
	'collch-artists_lists': 'artists_c'
});