var LoadableList,
	ListsModel,
	TagsList;

(function(){
"use strict";
LoadableList = function() {};
mapLevelModel.extendTo(LoadableList, {
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
				if (!e.no_changing_mark){
					this.setChild(this.preview_mlist_name, e.value, true);
				}
			});
		}
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
		var main_list = this[this.main_list_name];
		return main_list.length;
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
		
		this.setChild(this.main_list_name, this[this.main_list_name], mlc_opts || true);
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

		this.setChild('auth_part', auth_rqb);

		this.map_parent.on('state-change.vswitched', function(e) {
			_this.checkPMDSwiched(e.value);
		});

	},
	switchPmd: function(toggle) {
		var new_state;
		if (typeof toggle == 'boolean')	{
			new_state = toggle;
		} else {
			new_state = !this.state('pmd_vswitched');
		}
		if (new_state){
			if (!this.state('pmd_vswitched')){
				this.map_parent.updateState('vswitched', this._provoda_id);
			}
		} else {
			if (this.state('pmd_vswitched')){
				this.map_parent.updateState('vswitched', false);
			}
		}
	},
	checkPMDSwiched: function(value) {
		this.updateState('pmd_vswitched', value == this._provoda_id);
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

TagsList = function() {};
LoadableList.extendTo(TagsList, {
	model_name: 'tagslist',
	main_list_name: 'tags_list',
	addTag: function(name, silent) {
		var main_list = this[this.main_list_name];
		main_list.push(name);

		if (!silent){
			//this.setChild(this.main_list_name, main_list, true);
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