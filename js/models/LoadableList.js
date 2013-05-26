define(['./LoadableListBase', 'spv', 'js/libs/Mp3Search'], function(LoadableListBase, spv, Mp3Search){
"use strict";



var LoadableList = function() {};
LoadableListBase.extendTo(LoadableList, {
	getHypemArtistsList: function() {

	},
	getHypemTracksList: function(r) {
		var result_list = [];
		for (var num in r){
			if (num == parseInt(num, 10) && r[num]){
				result_list.push(r[num]);
			}
		}
		var track_list = [];
		for (var i = 0; i < result_list.length; i++) {
			var cur = result_list[i];
			var song_omo = {
				artist: cur.artist,
				track: cur.title
			};
			if (!song_omo.artist){
				song_omo = Mp3Search.guessArtist(cur.title);
			}
			song_omo.image_url = cur.thumb_url;
			if (song_omo.artist && song_omo.track){
				track_list.push(song_omo);
			} else {
				console.log('there is no needed attributes');
				console.log(cur);
			}

		}
		return track_list;
	},
	sendHypemDataRequest: function(paging_opts, request_info, opts) {
		var
			no_paging = opts.no_paging,
			path = opts.path,
			parser = opts.parser;

		var _this = this;
		request_info.request = this.app.hypem.get(path, opts.data, {nocache: this.state('error')})
			.done(function(r) {
				var data_list = parser.call(this, r, paging_opts);
				_this.putRequestedData(request_info.request, data_list, !r[0]);

			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});
		return request_info;
	},

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
		if (data){
			spv.cloneObj(request_data, data);
		}
		request_info.request = this.app.lfm.get(method, request_data, rqop)
			.done(function(r){
				var data_list = parser.call(this, r, field_name, paging_opts);
				if (no_paging && !r.error){
					_this.setLoaderFinish();
				}
				_this.putRequestedData(request_info.request, data_list, r.error);
			})
			.fail(function(){
				_this.requestComplete(request_info.request, true);
			}).always(function() {
				request_info.done = true;
			});
		return request_info;
	},
	getLastfmAlbumsList: function(r, field_name, paging_opts) {
		var albums_data = spv.toRealArray(spv.getTargetField(r, field_name));
		var data_list = [];
		if (albums_data.length) {
			var l = Math.min(albums_data.length, paging_opts.page_limit);
			for (var i=paging_opts.remainder; i < l; i++) {
				var cur = albums_data[i];
				data_list.push({
					album_artist: spv.getTargetField(cur, 'artist.name'),
					album_name: cur.name,
					lfm_image: {
						array: cur.image
					},
					playcount: cur.playcount
				});
			}
			
		}
		return data_list;
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
	getLastfmTracksList: function(r, field_name, paging_opts) {
		var tracks = spv.toRealArray(spv.getTargetField(r, field_name));
		var track_list = [];
		if (tracks) {
			for (var i=paging_opts.remainder, l = Math.min(tracks.length, paging_opts.page_limit); i < l; i++) {
				track_list.push({
					'artist' : tracks[i].artist.name,
					'track': tracks[i].name,
					lfm_image:  {
						array: tracks[i].image
					}
				});
			}
		}
		return track_list;
	}
});

var TagsList = function() {};
LoadableList.extendTo(TagsList, {
	model_name: 'tagslist',
	main_list_name: 'tags_list',
	addTag: function(name, silent) {
		var main_list = this[this.main_list_name];
		main_list.push(name);

		if (!silent){
			//this.updateNesting(this.main_list_name, main_list);
			this.updateState(this.main_list_name, [].concat(main_list));
		}
	},
	dataListChange: function() {
		var main_list = this[this.main_list_name];
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