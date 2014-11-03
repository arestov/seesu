define(['spv', 'hex_md5', './helpers', 'js/libs/morph_helpers'], function(spv, hex_md5, hp, morph_helpers) {
'use strict';
return function(main_calls_flow) {

var BindControl = function(evcompanion, opts) {
	this.evcompanion = evcompanion;
	this.opts = opts;

};
BindControl.prototype = {
	subscribe: function() {
		this.unsubcribe();
		this.evcompanion._pushCallbackToStack(this.opts);
	},
	unsubcribe: function() {
		this.evcompanion.off(this.opts.namespace, this.opts.cb, this.opts);
	}
};


var ev_na_cache = {};

var clean_obj = {};

var cached_parsed_namespace = {};
var parseNamespace = function(namespace) {
	if (!cached_parsed_namespace[namespace]){
		cached_parsed_namespace[namespace] = namespace.split('.');
	}
	return cached_parsed_namespace[namespace];
};
var EventSubscribingOpts = function(short_name, namespace, cb, once, context, immediately, wrapper) {
	this.short_name = short_name;
	this.namespace = namespace;
	this.cb = cb;
	this.once = once;
	this.context = context;
	this.immediately = immediately;
	this.wrapper = wrapper || null;
};


var findErrorByList = function(data, errors_selectors) {
	var i, cur, has_error;
	for (i = 0; i < errors_selectors.length; i++) {
		cur = errors_selectors[i];
		has_error = spv.getTargetField(data, cur);
		if (has_error){
			break;
		}
	}
	return has_error;
};

var requests_by_declarations = {};
var getRequestByDeclr = function(send_declr, sputnik, opts, network_api_opts) {

	var api_name = send_declr[0], api_method = send_declr[1], api_args = send_declr[2].call(sputnik, opts),
		non_standart_api_opts = send_declr[3];

	var network_api = hp.getNetApiByDeclr(send_declr, sputnik);
	

	if (!network_api.source_name) {
		throw new Error('network_api must have source_name!');
	}

	if (!network_api.errors_fields && !network_api.checkResponse) {
		throw new Error('provide a way to detect errors!');
	}


	if (typeof api_name != 'string') {
		api_name = network_api.api_name;
	}

	if (typeof api_name != 'string') {
		throw new Error('network_api must have api_name!');
	}

	var manual_nocache = api_args[2] && api_args[2].nocache;

	if (!non_standart_api_opts) {
		if (!api_args[2]) {
			api_args[2] = network_api_opts;
		} else {
		}
	}
	
	var cache_key;
	if (!non_standart_api_opts && !manual_nocache) {
		var big_string = JSON.stringify([api_name, api_method, api_args]);
		cache_key = hex_md5(big_string);
		if (requests_by_declarations[cache_key]) {
			return requests_by_declarations[cache_key];
		}

	}
	


	var request = network_api[ api_method ].apply(network_api, api_args);
	request.network_api = network_api;
	if (cache_key) {
		requests_by_declarations[cache_key] = request;
		request.always(function() {
			delete requests_by_declarations[cache_key];
		});
	}

	return request;
};

var FastEventor = function(context) {
	this.sputnik = context;
	this.subscribes = null;
	this.subscribes_cache = null;
	this.reg_fires = null;
	if (context.reg_fires){
		this.reg_fires = context.reg_fires;
	}
	this.requests = null;
	this._requestsSortFunc = null;
	this.mapped_reqs = null;//this.sputnik.req_map ? {} : null;
	this.nesting_requests = null;//this.sputnik.has_reqnest_decls ? {} : null;
};
FastEventor.prototype = {
	_pushCallbackToStack: function(opts) {
		if (!this.subscribes) {
			this.subscribes = {};
		}

		if (!this.subscribes[opts.short_name]){
			this.subscribes[opts.short_name] = [];
		}
		this.subscribes[opts.short_name].push(opts);
		this.resetSubscribesCache(opts.short_name);
	},
	getPossibleRegfires: function(namespace) {
		if (!this.reg_fires){
			return;
		}
		if (this.reg_fires.cache && this.reg_fires.cache[namespace]){
			return this.reg_fires.cache[namespace];
		}

		var parts = parseNamespace(namespace);
		var funcs = [];
		var i = 0;
		if (this.reg_fires.by_namespace){
			for (i = parts.length - 1; i > -1; i--) {
				var posb_namespace = parts.slice(0, i + 1).join('.');
				if (this.reg_fires.by_namespace[posb_namespace]){
					funcs.push(this.reg_fires.by_namespace[posb_namespace]);
				}
			}
		}
		if (this.reg_fires.by_test){
			for (i = 0; i < this.reg_fires.by_test.length; i++) {
				if (this.reg_fires.by_test[i].test.call(this.sputnik, namespace)){
					funcs.push(this.reg_fires.by_test[i]);
				}
			}
		}
		
		if (!this.reg_fires.cache){
			this.reg_fires.cache = {};
		}
		this.reg_fires.cache[namespace] = funcs;
		return funcs;
	},

	hndUsualEvCallbacksWrapper: function(motivator, fn, context, args, arg) {
		if (motivator.p_space) {
			this.zdsv.removeFlowStep(motivator.p_space, motivator.p_index_key, motivator);
		}
		if (args){
			fn.apply(context, args);
		} else {
			fn.call(context, arg);
		}
	},
	_addEventHandler: function(namespace, cb, context, immediately, exlusive, skip_reg, soft_reg, once, easy_bind_control){
		//common opts allowed
		if (this.sputnik.convertEventName){
			namespace = this.sputnik.convertEventName(namespace);
		}

		var
			fired = false,
			_this = this,
			name_parts = parseNamespace(namespace),
			short_name = name_parts[0];

		if (exlusive){
			this.off(namespace);
		}

		var reg_args = null, one_reg_arg = null;

		var callbacks_wrapper = this.hndUsualEvCallbacksWrapper;

		var reg_fires = this.getPossibleRegfires(namespace);
		if (reg_fires && reg_fires.length){
			reg_args = reg_fires[0].fn.call(this.sputnik, namespace, name_parts);
			if (reg_args) {
				fired = true;
				if (!Array.isArray(reg_args)) {
					one_reg_arg = reg_args;
					reg_args = null;
				}
			}
			
		}
		if (fired){
			if (reg_fires[0].getWrapper){
				callbacks_wrapper = reg_fires[0].getWrapper.call(this.sputnik);
			}
			if (!skip_reg){
				var mo_context = context || _this.sputnik;
				if (soft_reg === false){
					if (one_reg_arg) {
						cb.call(mo_context, one_reg_arg);
					} else {
						cb.apply(mo_context, reg_args);
					}
					
				} else {
					var flow_step = this.sputnik._getCallsFlow().pushToFlow(cb, mo_context, reg_args, one_reg_arg, callbacks_wrapper, this.sputnik, this.sputnik.current_motivator);
					if (reg_fires[0].handleFlowStep) {

						reg_fires[0].handleFlowStep.call(this.sputnik, flow_step, reg_fires[0].getFSNamespace(namespace));
					}
				}
			}
		}


		var subscr_opts = new EventSubscribingOpts(short_name, namespace, cb, once, context, immediately, callbacks_wrapper);

		if (!(once && fired)){
			this._pushCallbackToStack(subscr_opts);
		}
		if (easy_bind_control){
			var bind_control = new BindControl(this, subscr_opts);
			return bind_control;
		} else {
			return this.sputnik;
		}
	},
	once: function(namespace, cb, opts, context){
		return this._addEventHandler(
			namespace,
			cb,
			opts && opts.context || context,
			opts && opts.immediately,
			opts && opts.exlusive,
			opts && opts.skip_reg,
			opts && opts.soft_reg,
			true,
			opts && opts.easy_bind_control);
	},
	on: function(namespace, cb, opts, context){
		return this._addEventHandler(
			namespace,
			cb,
			opts && opts.context || context,
			opts && opts.immediately,
			opts && opts.exlusive,
			opts && opts.skip_reg,
			opts && opts.soft_reg,
			false,
			opts && opts.easy_bind_control);
	},
	off: function(namespace, cb, obj, context){
		if (this.sputnik.convertEventName){
			namespace = this.sputnik.convertEventName(namespace);
		}
		var
			short_name = parseNamespace(namespace)[0],
			queried = this.getMatchedCallbacks(namespace);

		if (this.subscribes && this.subscribes[short_name]){
			var clean = [];
			if (cb || obj){
				for (var i = 0; i < queried.matched.length; i++) {
					var cur = queried.matched[i];
					if (obj && obj == cur){
						continue;
					}
					if (cb){
						if (cur.cb == cb){
							if (!context || cur.context == context){
								continue;
							}
							
						}
					}
					clean.push(queried.matched[i]);
				}
			}
			clean.push.apply(clean, queried.not_matched);
			if (clean.length != this.subscribes[short_name].length){
				this.subscribes[short_name] = clean;
				this.resetSubscribesCache(short_name);
			}
		}

		return this.sputnik;
	},
	resetSubscribesCache: (function() {
		var isEvNSMatching = function(cur_namespace, short_name) {
			var last_char = cur_namespace.charAt(short_name.length);

			return (!last_char || last_char == '.') && spv.startsWith(cur_namespace, short_name);
		};

		return function(short_name) {
			if (!this.subscribes_cache) {
				return;
			}

			//fixme - bug for "state_change-workarea_width.song_file_progress" ( "state_change-workarea_width" stays valid, but must be invalid)
			for (var cur_namespace in this.subscribes_cache){
				if (!this.subscribes_cache[cur_namespace]){
					continue;
				}
				
				if (isEvNSMatching( cur_namespace, short_name )){
					this.subscribes_cache[cur_namespace] = null;
				}
			}
		};
	})(),
	_empty_callbacks_package: {
		matched: [],
		not_matched: []
	},

	getMatchedCallbacks: (function() {
		var isEvNSMatching = function(curn, namespace) {
			var last_char = curn.charAt(namespace.length);
			return (!last_char || last_char == '.') && spv.startsWith(curn, namespace);
		};

		var find = function(namespace, cb_cs) {
			var matched = [], not_matched = [];
			if (!ev_na_cache[namespace]) {
				ev_na_cache[namespace] = {};
			}
			var cac_space = ev_na_cache[namespace];
			for (var i = 0; i < cb_cs.length; i++) {
				var curn = cb_cs[i].namespace;
				var canbe_matched = cac_space[curn];
				if (typeof canbe_matched == 'undefined') {
					
					canbe_matched = isEvNSMatching(curn, namespace);
					cac_space[curn] = canbe_matched;
				}
				if (canbe_matched){
					matched.push(cb_cs[i]);
				} else {
					not_matched.push(cb_cs[i]);
				}
			}
			return {matched: matched, not_matched: not_matched};
		};
		return function(namespace){
			if (this.sputnik.convertEventName){
				namespace = this.sputnik.convertEventName(namespace);
			}
			var
				r, short_name = parseNamespace(namespace)[0];

			var cb_cs = this.subscribes && this.subscribes[short_name];
			if (cb_cs){
				var cached_r = this.subscribes_cache && this.subscribes_cache[namespace];
				if (cached_r){
					return cached_r;
				} else {
					r = find(namespace, cb_cs);
					if (!this.subscribes_cache) {
						this.subscribes_cache = {};
					}
					this.subscribes_cache[namespace] = r;
				}

			} else {
				return this._empty_callbacks_package;
			}

			return r;
		};
	})(),
	callEventCallback: function(cur, args, opts, arg) {
	//	var _this = this;
		if (cur.immediately && (!opts || !opts.force_async)){
			if (args){
				cur.cb.apply(cur.context || this.sputnik, args);
			} else {
				cur.cb.call(cur.context || this.sputnik, arg);
			}
			
		} else {
			var callback_context = cur.context || this.sputnik;
			var wrapper_context = this.sputnik;

			var calls_flow = (opts && opts.emergency) ? main_calls_flow : this.sputnik._getCallsFlow();
			return calls_flow.pushToFlow(cur.cb, callback_context, args, arg, cur.wrapper, wrapper_context, this.sputnik.current_motivator);
			/*
			setTimeout(function() {
				cur.cb.apply(_this, args);
			},1);*/
		}
	},
	triggerCallbacks: function(cb_cs, args, opts, ev_name, arg, flow_steps_array){
		for (var i = 0; i < cb_cs.length; i++) {
			var cur = cb_cs[i];
			var flow_step = this.callEventCallback(cur, args, opts, arg);
			if (flow_step && flow_steps_array) {
				flow_steps_array.push(flow_step);
			}
			if (cur.once){
				this.off(ev_name, false, cur);
			}
		}
	},
	trigger: function(ev_name){
		var cb_cs = this.getMatchedCallbacks(ev_name).matched;
		if (cb_cs){
			var i = 0;
			var args = new Array(arguments.length - 1);
			for (i = 1; i < arguments.length; i++) {
				args[ i - 1 ]= arguments[i];
			}

			for (i = 0; i < cb_cs.length; i++) {
				var cur = cb_cs[i];
				this.callEventCallback(cur, args, (args && args[ args.length -1 ]));
				if (cur.once){
					this.off(ev_name, false, cur);
				}
			}
		}
		return this;
	},
	default_requests_space: 'nav',
	getRequests: function(space) {
		space = space || this.default_requests_space;
		return this.requests && this.requests[space];
	},
	getQueued: function(space) {
		//must return new array;
		var requests = this.getRequests(space);
		return requests && spv.filter(requests, 'queued');
	},
	addRequest: function(rq, opts){
		this.addRequests([rq], opts);
		return this.sputnik;
	},
	addRequests: function(array, opts) {
		//opts = opts || {};
		//space, depend
		var space = (opts && opts.space) || this.default_requests_space;
		var i = 0, req = null;

		if (opts && opts.order){
			for (i = 0; i < array.length; i++) {
				req = array[i];
				spv.setTargetField(req, this.sputnik.getReqsOrderField(), opts.order);
				req.order = opts.order;
			}
		}
		if (!this.requests) {
			this.requests = {};
		}

		if (!this.requests[space]){
			this.requests[space] = [];
		}

		var target_arr = this.requests[space];
		
		var bindRemove = function(_this, req) {
			req.always(function() {
				if (_this.requests && _this.requests[space]){
					_this.requests[space] = spv.findAndRemoveItem(_this.requests[space], req);
				}
				
			});
		};
		var added = new Array(array.length);
		for (i = 0; i < array.length; i++) {
			req = array[i];
			/*if (req.queued){
				spv.setTargetField(req.queued, 'mdata.' + this._provoda_id, this);
			}*/
			if (target_arr.indexOf(req) != -1){
				continue;
			}
			if (opts && opts.depend){
				if (req){
					req.addDepend(this.sputnik);
				}
			}
			target_arr.push(req);
			bindRemove(this, req);
			added[i] = req;
		}
		if (added.length){
			if (!opts || !opts.skip_sort){
				this.sortRequests(space);
			}

			this.trigger('requests', added, space);
		}


	},
	_getRequestsSortFunc: function() {
		if (!this._requestsSortFunc) {
			var field_name = this.sputnik.getReqsOrderField();
			this._requestsSortFunc = spv.getSortFunc([
				function(el){
					if (typeof spv.getTargetField(el, field_name) == 'number'){
						return false;
					} else {
						return true;
					}
				},
				field_name
			]);

		}
		return this._requestsSortFunc;
	},

	sortRequests: function(space) {
		var requests = this.requests && this.requests[space || this.default_requests_space];
		if (!this.requests || !this.requests.length) {
			return;
		}
		return requests.sort(this._getRequestsSortFunc());
	},
	getAllRequests: function() {
		var all_requests;
		if (!this.requests) {
			return all_requests;
		}
		for (var space in this.requests){
			if (this.requests[space].length){
				if (!all_requests) {
					all_requests = [];
				}
				all_requests.push.apply(all_requests, this.requests[space]);
			}
		}
		return all_requests;
	},
	stopRequests: function(){

		var all_requests = this.getAllRequests();

		while (all_requests && all_requests.length) {
			var rq = all_requests.pop();
			if (rq) {
				if (rq.softAbort){
					rq.softAbort(this.sputnik);
				} else if (rq.abort){
					rq.abort(this.sputnik);
				}
			}
		}
		hp.wipeObj(this.requests);
		return this;
	},
	getModelImmediateRequests: function(space) {
		var queued = this.getQueued(space);
		if (queued){
			queued.reverse();
		}
		
		return queued;
	},
	setPrio: function(space) {
		var groups = [];
		var immediate = this.getModelImmediateRequests(space);
		if (immediate){
			groups.push(immediate);
		}
		var relative = this.sputnik.getRelativeRequestsGroups(space);
		if (relative && relative.length){
			groups.push.apply(groups, relative);
		}
		var setPrio = function(el) {
			el.setPrio();
		};
		groups.reverse();
		for (var i = 0; i < groups.length; i++) {
			groups[i].forEach(setPrio);
		}
		return this.sputnik;
	},
	
	
	requestState: function(state_name) {
		var current_value = this.sputnik.state(state_name);
		if (current_value) {
			return;
		}

		var i, cur, states_list, maps_for_state = hp.getReqMapsForState(this.sputnik.req_map, state_name);

		var cant_request;
		if (this.mapped_reqs) {
			for (i = 0; i < maps_for_state.length; i+=2) {
				cur = this.mapped_reqs[maps_for_state[i]];
				if (cur && (cur.done || cur.process)) {
					cant_request = true;
					break;
				}
			}
		}
		
		if (cant_request) {
			return;
		}

		var selected_map = maps_for_state[1];
		var selected_map_num = maps_for_state[0];
		if (!this.mapped_reqs) {
			this.mapped_reqs = {};
		}


		if ( !this.mapped_reqs[selected_map_num] ) {
			this.mapped_reqs[selected_map_num] = {
				done: false,
				error: false,
				process: false
			};
		}

		var store = this.mapped_reqs[selected_map_num];

		
		states_list = selected_map[0];
		this.sputnik.updateManyStates(this.makeLoadingMarks(states_list, true));
		var parse = selected_map[1], send_declr = selected_map[2];
		

		

		var request = getRequestByDeclr(send_declr, this.sputnik,
			{has_error: store.error},
			{nocache: store.error});
		var network_api = request.network_api;

		store.process = true;
		var _this = this;
		request
				.always(function() {
					store.process = false;
					_this.sputnik.updateManyStates(_this.makeLoadingMarks(states_list, false));
				})
				.fail(function(){
					store.error = true;
				})
				.done(function(r){
					var has_error = network_api.errors_fields ? findErrorByList(r, network_api.errors_fields) : network_api.checkResponse(r);
					var i;
					if (has_error){
						store.error = true;
					} else {
						var result = parse.call(_this.sputnik, r, null, morph_helpers);
						if (result) {
							var result_states;

							if (Array.isArray(result)) {
								if (result.length != states_list.length) {
									throw new Error('values array does not match states array');
								}

								result_states = {};
								for (i = 0; i < states_list.length; i++) {
									result_states[ states_list[i] ] = result[ i ];
								}

							} else if (typeof result == 'object') {
								for (i = 0; i < states_list.length; i++) {
									if (!result.hasOwnProperty(states_list[i])) {
										throw new Error('object must have all props:' + states_list + ', but does not have ' + states_list[i]);
									}
								}
								result_states = result;
							}
							_this.sputnik.updateManyStates( result_states );


							store.error = false;
							store.done = true;
						} else {
							store.error = true;
						}
						
					}
				});
		
		this.addRequest(request);
		return request;

	},
	makeLoadingMarks: function(states_list, value) {
		var loading_marks = {};
		for (var i = 0; i < states_list.length; i++) {

			loading_marks[ states_list[i] + '__loading'] = value;
			
		}
		return loading_marks;
	},
	requestNesting: function(dclt, nesting_name) {
		if (!dclt) {
			return;
		}
		if (!this.nesting_requests) {
			this.nesting_requests = {};
		}

		if (!this.nesting_requests[ nesting_name ]) {
			this.nesting_requests[ nesting_name ] = {
				//has_items: false,
				has_all_items: false,
				last_page: 0,
				error: false,
				process: false
			};
		}

		var store = this.nesting_requests[ nesting_name ];
		if (store.process || store.has_all_items) {
			return;
		}

		var is_main_list = nesting_name == this.sputnik.main_list_name;

		this.sputnik.updateState('loading_nesting_' + nesting_name, true);
		if (is_main_list) {
			this.sputnik.updateState('main_list_loading', true);
		}
		var side_data_parsers = dclt[0][2];
		var parse_items = dclt[0][0], parse_serv = dclt[0][1], send_declr = dclt[1];
		var supports_paging = !!parse_serv;
		var paging_opts = this.sputnik.getPagingInfo(nesting_name);

		var network_api_opts = {
			nocache: store.error
		};

		if (supports_paging) {
			network_api_opts.paging = paging_opts;
		}
		

		

		var request = getRequestByDeclr(send_declr, this.sputnik,
			{has_error: store.error, paging: paging_opts},
			network_api_opts);
		var network_api = request.network_api;
		var source_name = network_api.source_name;

		store.process = true;
		var _this = this;
		request
				.always(function() {
					store.process = false;
					_this.sputnik.updateState('loading_nesting_' + nesting_name, false);
					if (is_main_list) {
						_this.sputnik.updateState('main_list_loading', false);
					}
				})
				.fail(function(){
					store.error = true;
				})
				.done(function(r){
					var sputnik = _this.sputnik;
					var has_error = network_api.errors_fields ? findErrorByList(r, network_api.errors_fields) : network_api.checkResponse(r);

					if (has_error){
						store.error = true;
					} else {
						var items = parse_items.call(sputnik, r, sputnik.head_props || clean_obj, morph_helpers);
						var serv_data = typeof parse_serv == 'function' && parse_serv.call(sputnik, r, paging_opts, morph_helpers);
						
				

						if (!supports_paging) {
							store.has_all_items = true;

							sputnik.updateState("all_data_loaded", true);
						} else {
							var has_more_data;
							if (serv_data === true) {
								has_more_data = true;
							} else if (serv_data && ((serv_data.hasOwnProperty('total_pages_num') && serv_data.hasOwnProperty('page_num')) || serv_data.hasOwnProperty('total'))) {
								if (!isNaN(serv_data.total)) {
									if ( (paging_opts.current_length + items.length) < serv_data.total && serv_data.total > paging_opts.page_limit) {
										has_more_data = true;
									}
								} else {
									if (serv_data.page_num < serv_data.total_pages_num) {
										has_more_data = true;
									}
								}

							} else {
								has_more_data = items.length == sputnik.page_limit;
							}



							if (!has_more_data) {
								store.has_all_items = true;
								sputnik.updateState("all_data_loaded", true);
							}
						}
						items = paging_opts.remainder ? items.slice( paging_opts.remainder ) : items;

						sputnik.nextTick(sputnik.insertDataAsSubitems, [nesting_name, items, serv_data, source_name], true);

						if (!sputnik.loaded_nestings_items) {
							sputnik.loaded_nestings_items = {};
						}

						if (!sputnik.loaded_nestings_items[nesting_name]) {
							sputnik.loaded_nestings_items[nesting_name] = 0;
						}
						var has_data_holes = serv_data === true || (serv_data && serv_data.has_data_holes === true);

						sputnik.loaded_nestings_items[nesting_name] += has_data_holes ? paging_opts.page_limit : items.length;
						//special logic where server send us page without few items. but it can be more pages available
						//so serv_data in this case is answer for question "Is more data available?"

						if (side_data_parsers) {
							for (var i = 0; i < side_data_parsers.length; i++) {
								sputnik.nextTick(
									_this.sputnik.handleNetworkSideData, [
										source_name,
										side_data_parsers[i][0],
										side_data_parsers[i][1].call(sputnik, r, paging_opts, morph_helpers)
									], true);

							}

						}

						


						//сделать выводы о завершенности всех данных
					}
				});

		this.addRequest(request);
		return request;

		/*
		есть ли декларация
		все ли возможные данные получены
		в процессе запроса (пока можно запрашивать в один поток)


		маркировка ошибок с прошлых запросов не участвует в принятиях решений, но используется для отказа от кеша при новых запросах


		*/
	}

};
return FastEventor;
};
});