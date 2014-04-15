define(['./LoadableListBase', 'spv', 'js/libs/Mp3Search'], function(LoadableListBase, spv, Mp3Search){
"use strict";



var start_end_spaces = /^\s|\s$/gi;
var LoadableList = function() {};
LoadableListBase.extendTo(LoadableList, {
	sendLFMDataRequest: function(paging_opts, request_info, opts, rqop) {
		var
			no_paging = opts.no_paging,
			method = opts.method,
			data = opts.data,
			parser = opts.parser,
			field_name = opts.field_name;

		var _this = this;

		var request_data = {
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		};
		if (!opts.disallow_paging){
			if (data){
				spv.cloneObj(data, request_data);
			}
		}
		
		request_info.request = this.app.lfm.get(method, data, rqop)
			.done(function(r){
				var data_list = parser.call(this, r, field_name, paging_opts);
				if (no_paging && !r.error){
					_this.setLoaderFinish();
				}
				_this.putRequestedData(request_info.request, data_list, r.error);
			});
		return request_info;
	},
	getLastfmArtistsList: function(r, field_name, paging_opts) {
		var artists = spv.toRealArray(spv.getTargetField(r, field_name));
		var data_list = [];
		if (artists && artists.length) {
			var l = Math.min(artists.length, paging_opts.page_limit);
			for (var i=0; i < l; i++) {
				data_list.push({
					artist: artists[i].name,
					lfm_image: {
						array: artists[i].image
					}
				});
			}

		}
		return data_list;
	},
});

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