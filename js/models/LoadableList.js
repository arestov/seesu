var LoadableList = function() {};
mapLevelModel.extendTo(LoadableList, {
	init: function(opts, params) {
		this._super(opts);
		this[this.main_list_name] = [];
		if (this.sendMoreDataRequest){
			this.updateState("has-loader", true);
		}
		this.on('state-change.mp-show', function(e) {
			if (e.value && e.value.userwant){
				this.preloadStart();
			}
			
		}, {skip_reg: true});
		this.on('child-change.' + this.main_list_name, function(e) {
			if (!e.no_changing_mark){
				this.setChild(this.preview_mlist_name, e.value, true);
			}
		});
	},
	'compx-more_load_available': {
		depends_on: ["has-loader", "list-loading", "loader_disallowed"],
		fn: function(can_load_more, loading, loader_disallowed) {
			if (can_load_more){
				return !loader_disallowed && !loading;
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
		this.updateState("has-loader", true);
		this.sendMoreDataRequest = cb;

		if (trigger){
			this.requestMoreData();
		}

	},
	requestMoreData: function(force) {
		if (this.state("has-loader") && this.sendMoreDataRequest){
			if (!this.request_info || this.request_info.done){
				this.markLoading();
				this.request_info = this.sendMoreDataRequest.call(this, this.getPagingInfo());
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
		this.updateState("has-loader", false);
	},
	markLoading: function(){
		this.updateState('list-loading', true);
		return this;
	},
	putRequestedData: function(request, data_list, error) {
		console.profile('data list inject');
		if (!this.request_info || this.request_info.request == request){
			

			if (!error && data_list && data_list.length){
				var mlc_opts = this.getMainListChangeOpts();
				
				for (var i = 0; i < data_list.length; i++) {
					this.addItemToDatalist(data_list[i], true);
				}
				
				this.setChild(this.main_list_name, this[this.main_list_name], mlc_opts || true);
				
			}
			if (!error && request && data_list.length < this.page_limit){
				this.setLoaderFinish();
			}
			this.requestComplete(request, error);
		}
		console.profileEnd();
		return this;

	},
	requestComplete: function(request, error) {
		if (!this.request_info || this.request_info.request == request){
			var main_list = this[this.main_list_name];

			this.updateState('list-loading', false);
			if (error && !main_list.length) {
				this.updateState('error', true);
			} else {
				this.updateState('error', false);
			}
			delete this.request_info;
		}
		return this;
	}

});