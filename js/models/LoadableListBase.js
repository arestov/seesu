define(['js/libs/BrowseMap', 'spv'], function(BrowseMap, spv) {
"use strict";
var LoadableListBase = function() {};
BrowseMap.Model.extendTo(LoadableListBase, {
	hndSPlOnFocus: function(e) {
		if (e.value){
			this.preloadStart();
		}
	},
	hndSPlOnLoadAllowing: function(e) {
		if (e.value && this.state('mp_has_focus')){
			this.preloadStart();
		}
	},
	hndCheckPreviews: function(e) {
		if (!e.skip_report){
			this.updateNesting(this.preview_mlist_name, e.value);
		}
	},
	init: function(opts) {
		this._super.apply(this, arguments);
		this.loadable_lists = {};
		this.request_info = null;
		this.loadable_lists[ this.main_list_name ] = [];
		this.updateNesting( this.main_list_name, []);

		var has_loader = !!(this.sendMoreDataRequest || this[ 'nest_req-' + this.main_list_name]);
		if (has_loader){
			this.updateState("has_loader", true);
		}
		this.wch(this, 'mp_has_focus', this.hndSPlOnFocus);
		this.on('state_change-more_load_available', this.hndSPlOnLoadAllowing);
		if (!this.manual_previews){
			this.on('child_change-' + this.main_list_name, this.hndCheckPreviews);
		}
		this.excess_data_items = {};
		this.loaded_nestings_items = {};
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
	handleNetworkSideData: function(source_name, ns, data) {
		this.app.handleNetworkSideData(source_name, ns, data);
	},
	main_list_name: 'lists_list',
	preview_mlist_name: 'preview_list',
	getMainListChangeOpts: function() {},
	page_limit: 30,
	getPagingInfo: function(nesting_name) {
		var length = this.getLength(nesting_name);
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
	getLength: function(nesting_name) {
		nesting_name = nesting_name || this.main_list_name;

		//return this.getNesting( nesting_name ).length - this.tumour_data_count - (this.excess_data_items[ nesting_name ] && this.excess_data_items[ nesting_name ].length || 0);
		return this.loaded_nestings_items[ nesting_name ] || 0;
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
	requestMoreData: function() {
		if (this[ 'nest_req-' + this.main_list_name ]) {
			this.requestNesting( this[ 'nest_req-' + this.main_list_name ], this.main_list_name );
		} else if (this.state("has_loader") && this.sendMoreDataRequest){
			if (!this.request_info || this.request_info.done){
				this.updateState('main_list_loading', true);
				var request_info = {
					request: null,
					done: null
				};
				this.sendMoreDataRequest.call(this, this.getPagingInfo(), request_info);
				this.request_info = request_info;
				if (!this.request_info.request){
					throw new Error('give me request');
				} else {
					var _this = this;
					this.addRequest(this.request_info.request);
					this.request_info.request
						.fail(function(){
							_this.requestComplete(request_info.request, true);
						}).always(function() {
							request_info.done = true;
						});


					
				}
			}
			//this.trigger("load-more");
		}
	},
	setLoaderFinish: function() {
		this.updateState("has_loader", false);
	},

	insertDataAsSubitems: function(nesting_name, data_list, opts) {
		var items_list = [];
		if (data_list && data_list.length){

			var mlc_opts = this.getMainListChangeOpts();
			for (var i = 0; i < data_list.length; i++) {
				if (this.isDataItemValid && !this.isDataItemValid(data_list[i])) {
					continue;
				}
				var item = this.addItemToDatalist(data_list[i], true);
				items_list.push(item);
			}
			this.dataListChange(mlc_opts, items_list);
			
			

		}
		
	},
	tickRequestedData: function(request, data_list, error) {
		//console.profile('data list inject');
		if (!this.request_info || this.request_info.request == request){
			if (!error) {

				if (!this.loaded_nestings_items[this.main_list_name]) {
					this.loaded_nestings_items[this.main_list_name] = 0;
				}
				this.loaded_nestings_items[this.main_list_name] += data_list.length;

				this.insertDataAsSubitems(this.main_list_name, data_list);
			}
			
			if (!error && data_list.length < this.page_limit){
				this.setLoaderFinish();
			}
			this.requestComplete(request, error);
		}
		//console.profileEnd();
	},
	putRequestedData: function(request, data_list, error) {
		this.nextTick(this.tickRequestedData, [request, data_list, error]);
		return this;

	},
	getRelativeRequestsGroups: function(space) {
		var main_models = this.getNesting(this.main_list_name);
		if (!main_models || !main_models.length){
			return;
		} else {
			main_models = main_models.slice();
			var more_models = this._super(space, true);
			if (more_models){
				main_models = main_models.concat(more_models);
			}
			var clean_array = spv.getArrayNoDubs(main_models);
			var groups = [];
			for (var i = 0; i < clean_array.length; i++) {
				var reqs = clean_array[i].getModelImmediateRequests(space);
				if (reqs && reqs.length){
					groups.push(reqs);
				}
			}
			return groups;
		}
	},
	dataListChange: function(mlc_opts, items) {
		var array = this.loadable_lists[this.main_list_name];
		if (this.beforeReportChange){

			array = this.beforeReportChange(array, items);
			this.loadable_lists[this.main_list_name] = array;
		}
		this.updateNesting(this.main_list_name, array, mlc_opts);
	},
	compareItemsWithObj: function(array, omo, soft) {
		for (var i = 0; i < array.length; i++) {
			if (this.compareItemWithObj(array[i], omo, soft)){
				return array[i];
			}
		}
	},
	addItemToDatalist: function(obj, silent) {
		return this.addDataItem(obj, silent);
	},
	addDataItem: function(obj, skip_changes, nesting_name) {
		nesting_name = nesting_name || this.main_list_name;
		if (!this.loadable_lists[ nesting_name ]) {
			this.loadable_lists[ nesting_name ] = [];
		}
		var
			item,
			work_array = this.loadable_lists[ nesting_name ],
			ml_ch_opts = !skip_changes && this.getMainListChangeOpts();

		var excess_items = this.excess_data_items[ nesting_name ];

		if (excess_items && excess_items.length){
			var matched = this.compareItemsWithObj(excess_items, obj);
			/*
			задача этого кода - сделать так, что бы при вставке новых данных всё что лежит в массиве
			"излишек" должно оставаться в конце массива
			*/
			//excess_items = this.excess_data_items[ nesting_name ];
			if (matched){
				item = matched;
				/*если совпадает с предполагаемыми объектом, то ставим наш элемент в конец рабочего массива
				и удаляем из массива "излишков", а сами излишки в самый конец */
				work_array = spv.arrayExclude(work_array, excess_items);
				excess_items = spv.arrayExclude(excess_items, matched);
				work_array.push(matched);
				work_array = work_array.concat(excess_items);

			} else {
				/* если объект не совпадает ни с одним элементом, то извлекаем все излишки,
				вставляем объект, вставляем элементы обратно */
				work_array = spv.arrayExclude(work_array, excess_items);
				work_array.push(item = this.makeItemByData(obj));
				work_array = work_array.concat(excess_items);


			}
			this.excess_data_items[ nesting_name ] = excess_items;
		} else {
			work_array.push(item = this.makeItemByData(obj));
		}
		this.loadable_lists[ nesting_name ] = work_array;
		if (!skip_changes){
			if (this.beforeReportChange){
				work_array = this.beforeReportChange( work_array, [item] );
				this.loadable_lists[ nesting_name ] = work_array;
			}
			this.updateNesting( nesting_name, work_array, ml_ch_opts );
		}
		return item;
	},
	getMainlist: function() {
		return this.loadable_lists[ [this.main_list_name] ];
	},
	makeItemByData: function(data) {
		if (this.subitemConstr){
			var item = new this.subitemConstr();
			item.init({
				map_parent: this,
				app: this.app
			}, data);
			return item;
		} else if (this.makeDataItem){
			return this.makeDataItem(data);
		} else {
			throw new Error('cant make item');
		}
	},
	findMustBePresentDataItem: function(obj, nesting_name) {
		nesting_name = nesting_name || this.main_list_name;
		var matched = this.compareItemsWithObj(this.getNesting( nesting_name ), obj);
		return matched || this.injectExcessDataItem(obj, nesting_name);
	},
	injectExcessDataItem: function(obj, nesting_name) {
		nesting_name = nesting_name || this.main_list_name;
		if (this.isDataInjValid && !this.isDataInjValid(obj)){
			return;
		}
		var
			work_array = this.loadable_lists[ nesting_name ],
			ml_ch_opts = this.getMainListChangeOpts(),
			item = this.makeItemByData(obj);

		if (!this.cant_find_dli_pos){
			if (!this.excess_data_items[ nesting_name ]) {
				this.excess_data_items[ nesting_name ] = [];
			}
			this.excess_data_items[ nesting_name ].push(item);
			work_array.push(item);
		} else {
			++this.tumour_data_count;
			work_array.unshift(item);
		}
		if (this.beforeReportChange){
			work_array = this.beforeReportChange(work_array, [item]);
			this.loadable_lists[ nesting_name ] = work_array;
		}

		this.updateNesting(nesting_name, work_array, ml_ch_opts);
		return item;
	},
	requestComplete: function(request, error) {
		if (!this.request_info || this.request_info.request == request){
			var main_list = this.loadable_lists[ this.main_list_name ];

			this.updateState('main_list_loading', false);
			if (error && !main_list.length) {
				this.updateState('error', true);
			} else {
				this.updateState('error', false);
			}
			this.request_info = null;
		}
		return this;
	},


	//auth things:

	authInit: function() {
		var _this = this;
		if (this.map_parent){
			this.switchPmd(false);
			this.map_parent.on('state_change-mp_has_focus', function(e) {
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
		auth_rqb.on('state_change-has_session', function(e) {
			_this.updateState('has_no_auth', !e.value);
			_this.switchPmd(false);
		});

		this.updateNesting('auth_part', auth_rqb);

		this.setPmdSwitcher(this.map_parent);

	},
	requestPage: function() {
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

return LoadableListBase;
});