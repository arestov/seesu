define(['./LoadableListBase', 'spv', 'js/libs/Mp3Search'], function(LoadableListBase, spv, Mp3Search){
"use strict";



var start_end_spaces = /^\s|\s$/gi;
var LoadableList = function() {};
LoadableListBase.extendTo(LoadableList, {});

var TagsList = function() {};
LoadableList.extendTo(TagsList, {
	model_name: 'tagslist',
	main_list_name: 'tags_list',
	addTag: function(name, silent) {
		var main_list = this.getMainlist();
		main_list.push(name);

		if (!silent){
			//this.updateNesting(this.main_list_name, main_list);
			this.updateState(this.main_list_name, [].concat(main_list));
		}
	},
	dataListChange: function() {
		var main_list = this.getMainlist();
		this.updateState(this.main_list_name, [].concat(main_list));

	},
	addItemToDatalist: function(obj, silent) {
		this.addTag(obj, silent);
	},
	'compx-data-list': {
		depends_on: ['tags_list', 'preview_list'],
		fn: function(tag_list, preview_list){
			return tag_list || preview_list;
		}
	},
	setPreview: function(list) {
		this.updateState('preview_list', list);
	},
	showTag: function(tag_name) {
		this.app.show_tag(tag_name);
	}
});
LoadableList.TagsList = TagsList;

return LoadableList;
});