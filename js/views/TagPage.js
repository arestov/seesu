var ArtistsListPreviewLine = function() {};
provoda.View.extendTo(ArtistsListPreviewLine, {
	createBase: function() {
		this.c = $('<li></li>');
	},
	'stch-nav-title': function(state) {
		this.c.text(state);
	}
});

var ArtistsListsView = function() {};
provoda.View.extendTo(ArtistsListsView, {
	createBase: function() {
		this.c = $('<div></div>');
		this.header = $('<h3></h3>').appendTo(this.c);
		this.header.text(localize('Artists'));
		this.listc = $('<ul></ul>').appendTo(this.c);
	},
	children_views: {
		lists_list: ArtistsListPreviewLine
	},
	'collch-lists_list': 'listc'
});

var TagPageView = function() {};
provoda.View.extendTo(TagPageView, {
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
			main: ArtistsListsView
		}
	},
	'collch-artists_lists': 'artists_c'
});