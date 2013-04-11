var LoadableList,
	ListsModel,
	TagsList;

(function(){
"use strict";

var LoadableListBase = function() {};
mapLevelModel.extendTo(LoadableListBase, {
	init: function(opts, params) {
		this._super(opts);
		this[this.main_list_name] = [];
		if (this.sendMoreDataRequest){
			this.updateState("has_loader", true);
		}
		this.on('vip-state-change.mp_show', function(e) {
			if (e.value && e.value.userwant){
				this.preloadStart();
			}

		}, {skip_reg: true});
		if (!this.manual_previews){
			this.on('child-change.' + this.main_list_name, function(e) {
				if (!e.skip_report){
					this.updateNesting(this.preview_mlist_name, e.value);
				}
			});
		}
		this.excess_data_items = [];
		this.tumour_data_count = 0;
	},
	'compx-list_loading': {
		depends_on: ['main_list_loading', 'preview_loading'],
		fn: function(main_list_loading, prevw_loading) {
			return main_list_loading || prevw_loading;
		}
	},
	'compx-more_load_available': {
		depends_on: ["has_loader", "list_loading", "loader_disallowed", 'has_no_access'],
		fn: function(can_load_more, loading, loader_disallowed, has_no_access) {
			if (can_load_more){
				return !loader_disallowed && !has_no_access && !loading;
			} else {

			}
		}
	},
	preview_mlist_name: 'preview_list',
	getMainListChangeOpts: function() {},
	page_limit: 30,
	getPagingInfo: function() {
		var length = this.getLength();
		var has_pages = Math.floor(length/this.page_limit);
		var remainder = length % this.page_limit;
		var next_page = has_pages + 1;

		return {
			current_length: length,
			has_pages: has_pages,
			page_limit: this.page_limit,
			remainder: remainder,
			next_page: next_page
		};
	},
	preloadStart: function() {
		this.loadStart();
	},
	getLength: function() {
		return this[this.main_list_name].length - this.tumour_data_count - (this.excess_data_items && this.excess_data_items.length);
	},
	loadStart: function() {
		if (this.state('more_load_available') && !this.getLength()){
			this.requestMoreData();
		}
	},
	setLoader: function(cb, trigger) {
		this.updateState("has_loader", true);
		this.sendMoreDataRequest = cb;

		if (trigger){
			this.requestMoreData();
		}

	},
	requestMoreData: function(force) {
		if (this.state("has_loader") && this.sendMoreDataRequest){
			if (!this.request_info || this.request_info.done){
				this.markLoading();
				this.request_info = this.sendMoreDataRequest.call(this, this.getPagingInfo(), {});
				if (!this.request_info.request){
					throw new Error('give me request');
				} else {
					this.addRequest(this.request_info.request);
				}
			}
			//this.trigger("load-more");
		}
	},
	setLoaderFinish: function() {
		this.updateState("has_loader", false);
	},
	markLoading: function(){
		this.updateState('main_list_loading', true);
		return this;
	},
	putRequestedData: function(request, data_list, error) {
		//console.profile('data list inject');
		if (!this.request_info || this.request_info.request == request){


			if (!error && data_list && data_list.length){

				var mlc_opts = this.getMainListChangeOpts();
				for (var i = 0; i < data_list.length; i++) {
					this.addItemToDatalist(data_list[i], true);
				}
				this.dataListChange(mlc_opts);

			}
			if (!error && request && data_list.length < this.page_limit){
				this.setLoaderFinish();
			}
			this.requestComplete(request, error);
		}
		//console.profileEnd();
		return this;

	},
	dataListChange: function(mlc_opts) {
		this.updateNesting(this.main_list_name, this[this.main_list_name], mlc_opts);
	},
	compareItemsWithObj: function(array, omo, soft) {
		for (var i = 0; i < array.length; i++) {
			if (this.compareItemWithObj(array[i], omo, soft)){
				return array[i];
			}
		}
	},
	addItemToDatalist: function(obj, silent) {
		this.addDataItem(obj, silent);
	},
	addDataItem: function(obj, skip_changes) {
		var
			item,
			excess_items,
			work_array = this[this.main_list_name],
			ml_ch_opts = !skip_changes && this.getMainListChangeOpts();

		if (this.excess_data_items && this.excess_data_items.length){
			var matched = this.compareItemsWithObj(this.excess_data_items, obj);
			/*
			задача этого кода - сделать так, что бы при вставке новых данные всё что лежит в массиве
			"излишек" должно оставаться в конце массива
			*/
			excess_items = this.excess_data_items;
			if (matched){
				item = matched;
				/*если совпадает с предполагаемыми объектом, то ставим наш элемент в конец рабочего массива
				и удаляем из массива "излишков", а сами излишки в самый конец */
				work_array = arrayExclude(work_array, excess_items);
				excess_items = arrayExclude(excess_items, matched);
				work_array.push(matched);
				work_array = work_array.concat(excess_items);

			} else {
				/* если объект не совпадает ни с одним элементом, то извлекаем все излишки,
				вставляем объект, вставляем элементы обратно */
				work_array = arrayExclude(work_array, excess_items);
				work_array.push(item = this.makeDataItem(obj));
				work_array = work_array.concat(excess_items);


			}
			this.excess_data_items = excess_items;
		} else {
			work_array.push(item = this.makeDataItem(obj));
		}

		this[this.main_list_name] = work_array;
		if (!skip_changes){
			this.updateNesting(this.main_list_name, work_array, ml_ch_opts);
		}
		return item;
	},
	findMustBePresentDataItem: function(obj) {
		var matched = this.compareItemsWithObj(this[this.main_list_name], obj);
		return matched || this.injectExcessDataItem(obj);
	},
	injectExcessDataItem: function(obj) {
		if (this.isDataInjValid && !this.isDataInjValid(obj)){
			return;
		}
		var
			work_array = this[this.main_list_name],
			ml_ch_opts = this.getMainListChangeOpts(),
			item = this.makeDataItem(obj);

		if (!this.cant_find_dli_pos){
			this.excess_data_items.push(item);
			work_array.push(item);
		} else {
			++this.tumour_data_count;
			work_array.unshift(item);
		}

		this.updateNesting(this.main_list_name, work_array, ml_ch_opts);
		return item;
	},
	requestComplete: function(request, error) {
		if (!this.request_info || this.request_info.request == request){
			var main_list = this[this.main_list_name];

			this.updateState('main_list_loading', false);
			if (error && !main_list.length) {
				this.updateState('error', true);
			} else {
				this.updateState('error', false);
			}
			delete this.request_info;
		}
		return this;
	},


	//auth things:

	authInit: function() {
		var _this = this;
		if (this.map_parent){
			this.switchPmd(false);
			this.map_parent.on('state-change.mp_has_focus', function(e) {
				if (!e.value){
					_this.switchPmd(false);
				}
			});
		}
	},
	authSwitching: function(auth, AuthConstr, params) {
		var auth_rqb = new AuthConstr();
		auth_rqb.init({auth: auth, pmd: this}, params);
		var _this = this;
		auth_rqb.on('state-change.has_session', function(e) {
			_this.updateState('has_no_access', !e.value);
			_this.switchPmd(false);
		});

		this.updateNesting('auth_part', auth_rqb);

		this.setPmdSwitcher(this.map_parent);

	},
	requestList: function() {
		if (!this.state('has_no_access')){
			this.loadStart();
			this.showOnMap();
		} else {
			this.map_parent.zoomOut();
			this.switchPmd();
		}
	}


	// :auth things

});

LoadableList = function() {};
LoadableListBase.extendTo(LoadableList, {
	getHypemArtistsList: function(r) {

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
				song_omo = guessArtist(cur.title);
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

	sendLFMDataRequest: function(paging_opts, request_info, opts) {
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
			cloneObj(request_data, data);
		}
		request_info.request = this.app.lfm.get(method, request_data)
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
	getLastfmArtistsList: function(r, field_name, paging_opts) {
		var artists = toRealArray(getTargetField(r, field_name));
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
		var tracks = toRealArray(getTargetField(r, field_name));
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

TagsList = function() {};
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
	}
});

ListsModel = function() {};
mapLevelModel.extendTo(ListsModel, {
	init: function(opts) {
		this._super(opts);
		var _this = this;
		this.on('vip-state-change.mp_show', function(e) {
			if (e.value && e.value.userwant){
				for (var i = 0; i < _this.lists_list.length; i++) {
					_this.lists_list[i].preloadStart();
				}
			}
		});
	}
});


})();