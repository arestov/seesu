var PageView = function() {};
provoda.View.extendTo(PageView, {
	'stch-mp-show': function(state) {
		this.c.toggleClass('hidden', !state);
	}
});


var ArtistsListPreviewLine = function() {};
provoda.View.extendTo(ArtistsListPreviewLine, {
	createBase: function() {
		this.c = $('<li></li>');
	},
	'stch-nav-title': function(state) {
		this.c.text(state);
	}
});


var ItemOfLL = function() {};
provoda.View.extendTo(ItemOfLL, {
	createBase: function() {
		this.c = $('<li></li>');
		var _this = this;
		this.c.click(function() {
			_this.md.showOnMap();
		});
	},
	'stch-nav-title': function(state) {
		this.c.text(state);
	}
});

var ListOfListsView = function() {};
PageView.extendTo(ListOfListsView, {
	createBase: function() {
		this.c = $('<div class="tag_artists"></div>');
	},
	children_views: {
		lists_list: ItemOfLL
	},
	'collch-lists_list': 'c'
});

var ArtistsListsPreview = function() {};
provoda.View.extendTo(ArtistsListsPreview, {
	createBase: function() {
		this.c = $('<div class="tag_artists-preview area_for_button"></div>');
		var _this = this;
		this.big_button = $('<div class="area-button"></div>').appendTo(this.c);
		this.big_button.click(function() {
			_this.md.showOnMap();
		});
		this.header = $('<span></span>').text(localize('Artists')).appendTo(this.big_button);
		this.listc = $('<ul class="area-description"></ul>').appendTo(this.c);
	},
	children_views: {
		lists_list: ArtistsListPreviewLine
	},
	'collch-lists_list': 'listc'
});

var TagPageView = function() {};
PageView.extendTo(TagPageView, {
	createBase: function() {
		this.c = $('<div class="tag_page"></div>');
		this.header = $('<h2></h2>').appendTo(this.c);
		this.artists_c = $('<div class="artists_lists"></div>').appendTo(this.c);
	},
	'stch-tag-name': function(state) {
		this.header.text(state);
	},
	children_views: {
		artists_lists: {
			main: ArtistsListsPreview
		}
	},
	'collch-artists_lists': 'artists_c'
});