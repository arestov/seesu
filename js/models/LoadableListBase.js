define(['js/libs/BrowseMap', 'spv'], function(BrowseMap, spv) {
"use strict";
var LoadableListBase = function() {};
BrowseMap.Model.extendTo(LoadableListBase, {
	init: function(opts) {
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
		this.on('state-change.more_load_available', function(e) {
			var mp_show = this.state('mp_show');
			if (e.value && mp_show && mp_show.userwant){
				this.preloadStart();
			}
			
		});
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
	requestMoreData: function() {
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

			var items_list = [];
			if (!error && data_list && data_list.length){

				var mlc_opts = this.getMainListChangeOpts();
				for (var i = 0; i < data_list.length; i++) {
					var item = this.addItemToDatalist(data_list[i], true);
					items_list.push(item);
				}
				this.dataListChange(mlc_opts, items_list);

			}
			if (!error && request && data_list.length < this.page_limit){
				this.setLoaderFinish();
			}
			this.requestComplete(request, error);
			if (items_list.length){
				return items_list;
			}
		}
		//console.profileEnd();
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
		if (this.beforeReportChange){
			this.beforeReportChange(this[this.main_list_name], items);
		}
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
		return this.addDataItem(obj, silent);
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
				work_array = spv.arrayExclude(work_array, excess_items);
				excess_items = spv.arrayExclude(excess_items, matched);
				work_array.push(matched);
				work_array = work_array.concat(excess_items);

			} else {
				/* если объект не совпадает ни с одним элементом, то извлекаем все излишки,
				вставляем объект, вставляем элементы обратно */
				work_array = spv.arrayExclude(work_array, excess_items);
				work_array.push(item = this.makeDataItem(obj));
				work_array = work_array.concat(excess_items);


			}
			this.excess_data_items = excess_items;
		} else {
			work_array.push(item = this.makeDataItem(obj));
		}

		this[this.main_list_name] = work_array;
		if (!skip_changes){
			if (this.beforeReportChange){
				this.beforeReportChange(work_array, [item]);
			}
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
		if (this.beforeReportChange){
			this.beforeReportChange(work_array, [item]);
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