define(['provoda', './coct'], function(provoda, coct) {
"use strict";

var TagPageView = function() {};
coct.PageView.extendTo(TagPageView, {
	base_tree: {
		sample_name: 'tag_page'
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


