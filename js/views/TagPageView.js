define(['pv', './coct', 'jquery'], function(pv, coct, $) {
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


var TagsListPage = function() {};
coct.PageView.extendTo(TagsListPage, {
	base_tree: {
		sample_name: 'tags_list_page'
	},
	createTagLink: function(name) {
		return $('<a class="js-serv"></a>').text(name).click(function() {
			su.show_tag(name);
		});
	}
});

TagPageView.TagsListPage = TagsListPage;


return TagPageView;
});


