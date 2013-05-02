define(['provoda', './coct'], function(provoda, coct) {
"use strict";

var TagPageView = function() {};
coct.PageView.extendTo(TagPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('tag_page');
		this.createTemplate();
	},
	children_views: {
		artists_lists: coct.LiListsPreview,
		songs_list: coct.LiListsPreview,
		albums_list: coct.AlbumsListPreview,
		similar_tags: coct.TagsListPreview
	}
});
return TagPageView;
});


