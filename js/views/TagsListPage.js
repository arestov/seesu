define(['provoda', 'jquery', './coct'], function(provoda, $, coct) {
"use strict";
var tagListChange = function(array) {
	this.tpl.ancs.listc.empty();
	var df = document.createDocumentFragment();
	for (var i = 0; i < array.length; i++) {
		$(df).append(this.createTagLink(array[i].name));
		$(df).append(document.createTextNode(" "));
	}
	this.tpl.ancs.listc.append(df);
};

var TagsListPage = function() {};
coct.PageView.extendTo(TagsListPage, {
	base_tree: {
		sample_name: 'tags_list_page'
	},
	'stch-data-list': tagListChange,
	createTagLink: function(name) {
		return $('<a class="js-serv"></a>').text(name).click(function() {
			su.show_tag(name);
		});
	}
});
return TagsListPage;
});