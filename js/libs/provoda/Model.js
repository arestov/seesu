define(['spv', './StatesLabour', './helpers', './MDProxy', './provoda.initDeclaredNestings', './prsStCon', './updateProxy'],
function(spv, StatesLabour, hp, MDProxy, initDeclaredNestings, prsStCon, updateProxy) {
'use strict';
return function(StatesEmitter, big_index, views_proxies, sync_sender) {
var push = Array.prototype.push;
var cloneObj = spv.cloneObj;

var getComplexInitList = updateProxy.getComplexInitList;
var unsubcribeOld = function(evColr, items_list) {
	var index = {};
	if (evColr.controls_list.length){
		for (var i = 0; i < evColr.controls_list.length; i++) {
			var opts = evColr.controls_list[ i ];
			var cur = evColr.items_list[ i ];
			if (items_list.length && items_list.indexOf( cur ) != -1) {
				index[ cur._provoda_id || cur.view_id ] = opts;
			} else {
				cur.evcompanion.off(opts.namespace, opts.cb, opts);
			}
		}
	}
	return index;
};

var setEvLiItems = function(items_list) {
	var old_value = this.current_motivator;
	this.current_motivator = this.current_motivator;

	items_list = spv.toRealArray(items_list);
	var saved_items = unsubcribeOld( this, items_list );
	this.items_list = items_list;
	this.controls_list.length = 0;
	this.controls_list.length = items_list.length;
	for (var i = 0; i < items_list.length; i++) {
		var cur = items_list[i];
		var oldv = cur.current_motivator;
		cur.current_motivator = this.current_motivator;
		var cur_id = cur._provoda_id || cur.view_id;
		if (saved_items.hasOwnProperty( cur_id )) {
			this.controls_list[i] = saved_items[ cur_id ];
		} else {
			this.controls_list[i] = cur.evcompanion._addEventHandler(this.event_name, this.event_callback, this, false, false, true, false, false, true);
			//_addEventHandler: function(namespace, cb, context, immediately, exlusive, skip_reg, soft_reg, once, easy_bind_control)
		}
		cur.current_motivator = oldv;
	}
	this.current_motivator = old_value;
};

var ItemsEvents = function(event_name, md, callback) {
	this.items_list = null;
	this.md = md;
	this.controls_list = [];
	this.event_name = event_name;
	this.callback = callback;
	//this.skip_reg = true;
	this.current_motivator = null;
};

ItemsEvents.prototype = {
	event_callback: function(e) {
		var old_value = this.md.current_motivator;
		this.md.current_motivator = this.current_motivator;
		this.callback.call(this.md, {
			target: this.md,
			item: e && e.target,
			value: e && e.value,
			items: this.items_list
		});
		this.md.current_motivator = old_value;
	},
	setItemsReal: setEvLiItems,
	setItems: function(items_list) {
		this.setItemsReal( items_list && spv.toRealArray( items_list ) );
		this.event_callback();
	}
};

var one = function(state) {
	return state;
};
var every = function(values_array) {
	return !!values_array.every(hasargfn);
};
var some = function(values_array) {
	return !!values_array.some(hasargfn);
};

var hasargfn = function(cur) {return cur;};
var StatesArchiver = function(state_name, result_state_name, md, calculateResult) {
	this.items_list = null;
	this.controls_list = [];
	this.current_motivator = null;
	this.md = md;
	this.result_state_name = result_state_name;

	this.state_name = state_name;
	this.event_name = 'lgh_sch-' + this.state_name;
	//this.skip_reg = true;

	var calcR = calculateResult;
	if (calcR){
		if (typeof calcR == 'function'){
			this.calculate_result = calcR;
		} else {
			if (calcR == 'some'){
				this.calculate_result = some;
			} else if (calcR == 'every'){
				this.calculate_result = every;
			} else if (calcR == 'one') {
				this.calculate_result = one;
			}
		}

	} else {
		this.calculate_result = some;
	}


};
StatesArchiver.prototype = {
	event_callback: function() {
		this.getItemsValues();
	},
	setResult: function(value) {
		var old_value = this.md.current_motivator;
		this.md.current_motivator = this.current_motivator;
		this.md.updateState(this.result_state_name, value);
		this.md.current_motivator = old_value;
	},
	getItemsValues: function() {
		if (this.calculate_result == one) {
			var item = this.items_list[0];
			var state = item && item.state(this.state_name);
			this.setResult(state);
		} else {
			var values_list = new Array(this.items_list.length);
			for (var i = 0; i < this.items_list.length; i++) {
				values_list[i] = this.items_list[i].state(this.state_name);
			}
			this.setResult(this.calculate_result.call(this, values_list));
		}

	},
	setItemsReal: setEvLiItems,
	setItems: function(items_list) {
		this.setItemsReal( items_list && spv.toRealArray( items_list ) );
		this.event_callback();
	}
};

var stackNestingFlowStep = function(flow_step, nesting_name) {
	if (!this.zdsv) {
		this.zdsv = new StatesLabour(!!this.full_comlxs_index, this._has_stchs);
		//debugger;
	}
	flow_step.p_space = 'collch';
	flow_step.p_index_key = nesting_name;
	this.zdsv.createFlowStepsArray('collch', nesting_name).push(flow_step);
};

var getMDOfReplace = function(){
	return this.md;
};

var si_opts_cache = {};
var SIOpts = function(md) {
	this.map_parent = md;
	this.app = md.app;
};


var getSiOpts = function(md) {
	var provoda_id = md._provoda_id;
	if (!si_opts_cache[provoda_id]) {
		si_opts_cache[provoda_id] = new SIOpts(md);
	}
	return si_opts_cache[provoda_id];
};

var changeSources = function(store, netapi_declr) {
	if (typeof netapi_declr[0] == 'string') {
		store.api_names.push(netapi_declr[0]);
	} else {
		var network_api = netapi_declr[0].call();
		if (!network_api.source_name) {
			throw new Error('no source_name');
		}
		store.sources_names.push(network_api.source_name);
	}
};

var changeSourcesByApiNames = function(md, store) {
	if (!store.api_names_converted) {
		store.api_names_converted = true;
		for (var i = 0; i < store.api_names.length; i++) {
			var api_name = store.api_names[i];
			var network_api;
			if (typeof api_name == 'string') {
				network_api = spv.getTargetField(md.app, api_name);
			} else if (typeof api_name == 'function') {
				network_api = api_name.call(md);
			}
			if (!network_api.source_name) {
				throw new Error('network_api must have source_name!');
			}

			store.sources_names.push(network_api.source_name);
		}
	}
};


var getParsedStateChange = spv.memorize(function getParsedStateChange(string) {
	if (string.indexOf('@') == -1) {
		return false;
	}
	var parts = string.split('@');
	return {
		state: parts[0],
		selector: parts[1].split('.')
	};
});

var models_counters = 1;
var modelInit = (function() {
	var lw_count = 0;
	var buildItems = function(lnwatch) {
		if (!lnwatch.items_changed) {return;}
		lnwatch.items_changed = false;

		if (lnwatch.items) {
			lnwatch.items.length = 0;
		}

		if (lnwatch.one_item_mode) {
			return lnwatch;
		}

		if (!lnwatch.items) {
			lnwatch.items = [];
		}




		for (var provoda_id in lnwatch.items_index) {
			if (!lnwatch.items_index[provoda_id]) {
				continue;
			}
			lnwatch.items.push(lnwatch.items_index[provoda_id]);
		}
		return lnwatch;
	};

	var pvState = hp.state;
	var pvUpdate = updateProxy.update;

	var stateOf = spv.memorize(function(state_name) {
		return function(md) {
			return pvState(md, state_name);
		};
	});

	var stateG = function(callback) {
		return function(state_name) {
			return callback(stateOf(state_name));
		};
	};

	var toZipFunc = function(toValue) {
		return spv.memorize(stateG(toValue));
	};

	var map = toZipFunc(function(state) {
		return function(array) {
			return array && array.map(state);
		};
	});

	var some = toZipFunc(function(state) {
		return function(array) {
			return array.some(state);
		};
	});

	var every = toZipFunc(function(state) {
		return function(array) {
			return array.every(state);
		};
	});

	var one = toZipFunc(function(state) {
		return function(array) {
			return array[0] && state(array[0]);
		};
	});

	var arrayClone = function(array) {
		if (Array.isArray(array)) {
			return array.slice(0);
		} else {
			return array;
		}
	};


	var getZipFunc = spv.memorize(function(state_name, zip_name) {
		if (!state_name) {
			return arrayClone;
		}

		if (!zip_name) {
			return map(state_name);
		} else {
			switch (zip_name) {
				case 'one': {
					return one(state_name);
				}
				case 'some': {
					return some(state_name);
				}
				case 'every': {
					return every(state_name);
				}
				default: {
					throw new Error('unknow zip func ' + zip_name);
				}
			}
		}
	}, function(state_name, zip_name) {
		return (state_name || "") + '-' + (zip_name || "");
	});

	function hdkey(full_name, state_name, zip_func) {
		return (full_name || '') + '-' + (state_name || '') + '-' + (zip_func || '');
	}

	function standart(callback) {
		return function standart(motivator, fn, context, args, lnwatch) {
			buildItems(lnwatch);
			var md = lnwatch.md;
			var old_value = md.current_motivator;
			md.current_motivator = motivator;

			var items = lnwatch.one_item_mode ? ( lnwatch.state_name ? [lnwatch.one_item] : lnwatch.one_item ) : lnwatch.items;

			callback(md, items, lnwatch, args, motivator, fn, context);

			md.current_motivator = old_value;
		};
	}

	var wrapper = standart(function wrapper(md, items, lnwatch) {
		var callback = lnwatch.callback;
		callback(md, null, null, {
			items: items,
			item: null
		});
	});

	var getStateWriter = spv.memorize(function(full_name, state_name, zip_name) {
		var zip_func = getZipFunc(state_name, zip_name);
		return standart(function stateHandler(md, items) {
			pvUpdate(md, full_name, items && zip_func(items));
		});
	}, hdkey);


	var stateHandler = standart(function baseStateHandler(md, items, lnwatch, args) {
		if (!args.length) {return;}
		var callback = lnwatch.callback;
		callback(md, args[1], args[2], {
			items: items,
			item: args[3]
		});
	});



	var LocalWatchRoot = function(md, nwatch) {
		this.num = ++lw_count;
		this.selector = nwatch.selector;

		var full_name = nwatch.full_name;
		this.md = md;
		this.state_name = nwatch.state_name;
		// this.itemChange = handler;
		this.items_changed = false;
		this.items_index = null;
		this.items = null;
		this.one_item = null;
		this.one_item_mode = false;

		this.state_handler = nwatch.state_handler;
		this.zip_name = nwatch.zin_func;
		this.distance = 0;
		this.callback = nwatch.handler;

		// если есть full_name значит нам надо записать новое состояние
		// если нет, значит просто передать массив в пользовательскую функцию
		var full_name_handler = full_name && getStateWriter(full_name, this.state_name, this.zip_name);

		this.state_handler = this.state_name ? ( full_name ? full_name_handler : stateHandler) : null;

		this.handler = full_name ? full_name_handler : wrapper;

		if (!full_name) {
			// debugger;
		}

		if (!this.handler) {
			// debugger;
		}


		// если есть state_name значит массив будет состоять не из моделей
		// а из состояния этих моделей с соостветствующим названим


		// if (cur.state_name) {
		// 			md.archivateChildrenStates(cur.nesting_name, cur.state_name, cur.zin_func, cur.full_name);
		// 		} else {
		// 			watchNestingAsState(md, cur.nesting_name, cur.full_name);
		// 		}

		this.nwatch = nwatch;
	};
	return  function(self, opts, data, params, more, states){
		if (opts && opts.app){
			self.app = opts.app;
		}
		if (!self.app) {
			self.app = null;
		}
		if (opts && opts.map_parent){
			self.map_parent = opts.map_parent;
		}
		if (!self.map_parent) {
			self.map_parent = null;
		}

		self._super();

		self.req_order_field = null;
		self.states_links = null;

		self._provoda_id = models_counters++;
		big_index[self._provoda_id] = self;

		//self.states = {};

		self.children_models = null;
		self._network_source = self._network_source || null;


		self.md_replacer = null;
		self.mpx = null;

		self.init_states = self.init_states || null;

		if (states || (data && data.states)) {

			if (!self.init_states) {self.init_states = {};}

			cloneObj(self.init_states, states);

			if (data && data.states) {
				cloneObj(self.init_states, data.states);
			}
			// pv.create must init init_states
		}

		self.head = null;

		if (self.map_parent && self.map_parent.head) {
			if (!self.head) {self.head = {};}
			cloneObj(self.head, self.map_parent.head);
		}

		if (data && data.head) {
			if (!self.head) {self.head = {};}
			cloneObj(self.head, data.head);
		}

		if (self.network_data_as_states && data && data.network_states) {
			if (!self.init_states) {self.init_states = {};}
			cloneObj(self.init_states, data.network_states);

			if (self.net_head) {
				if (!self.head) {self.head = {};}
				for (var i = 0; i < self.net_head.length; i++) {
					var pk = self.net_head[i];
					self.head[pk] = data.network_states[pk];
				}
			}
		}

		if (self.head) {
			if (!self.init_states) {self.init_states = {};}

			cloneObj(self.init_states, self.head);
		}



		prsStCon.connect.parent(self);
		prsStCon.connect.root(self);
		prsStCon.connect.nesting(self);



		if (self.nestings_declarations) {
			self.nextTick(function(target) {
				initDeclaredNestings(target);
			});
		}


		self.nes_match_index = null;

		if (self.nest_match) {
			for (var i = 0; i < self.nest_match.length; i++) {

				self.addNestWatch(new LocalWatchRoot(self, self.nest_match[i]), 0);
			}
		}

		if (!self.manual_states_init) {
			self.initStates();
		}

		return self;
	};
})();
function Model(){}
StatesEmitter.extendTo(Model, function(add) {
add({
	getNonComplexStatesList: function(state_name) {
		if (!this.hasComplexStateFn(state_name)) {
			return state_name;
		} else {
			var result = [];
			for (var i = 0; i < this.compx_check[state_name].depends_on.length; i++) {
				var cur = this.compx_check[state_name].depends_on[i];
				if (cur == state_name) {
					continue;
				} else {
					result.push(this.getNonComplexStatesList(cur));
				}

				//
				//Things[i]
			}
			return spv.collapseAll.apply(null, result);
		}
	},
	getNestingSource: function(nesting_name, app) {
		nesting_name = hp.getRightNestingName(this, nesting_name);
		var dclt = this['nest_req-' + nesting_name];
		var network_api = dclt && hp.getNetApiByDeclr(dclt[1], this, app);
		return network_api && network_api.source_name;
	},
	getStateSources: function(state_name, app) {
		var parsed_state = hp.getEncodedState(state_name);
		if (parsed_state && parsed_state.rel_type == 'nesting') {
			return this.getNestingSource(parsed_state.nesting_name, app);
		} else {
			var maps_for_state = hp.getReqMapsForState(this.req_map, state_name);
			if (maps_for_state) {
				var result = new Array(maps_for_state.length/2);
				for (var i = 0; i < maps_for_state.length; i+=2) {
					var selected_map = maps_for_state[ i + 1 ];
					var network_api = hp.getNetApiByDeclr(selected_map[2], this, app);
					result[i/2] = network_api.source_name;
				}
				return result;
			}
		}



	},
	collectStateChangeHandlers: (function() {
		var getUnprefixed = spv.getDeprefixFunc( 'stch-' );
		var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );
		var NestWatch = hp.NestWatch;

		return function(props) {
			var need_recalc = false;

			if (props.state_change || hasPrefixedProps(props)) {
				need_recalc = true;
			}

			if (!need_recalc){
				return;
			}

			var index = {};

			for (var lprop in this.state_change) {
				index[lprop] = this.state_change[lprop];
			}

			for (var prop_name in this) {
				if (getUnprefixed(prop_name)) {
					var string = getUnprefixed(prop_name);
					index[string] = this[prop_name];
				}
			}

			this.st_nest_matches = [];

			for (var stname in index) {
				if (!index[stname]) {continue;}

				var nw_draft2 = getParsedStateChange(stname);
				if (!nw_draft2) { continue; }

				this.st_nest_matches.push(
					new NestWatch(nw_draft2.selector, nw_draft2.state, null, null, index[stname])
				);

			}

			this._has_stchs = true;
		};
	})(),
	collectNestingsDeclarations: (function() {
		var getUnprefixed = spv.getDeprefixFunc( 'nest-' );
		var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );
		return function(props) {
			var
				has_props = hasPrefixedProps(props),
				has_pack = this.hasOwnProperty('nest'),
				prop, cur, real_name;

			if (has_props || has_pack){
				var result = [];

				var used_props = {};

				if (has_props) {
					for (prop in this) {

						if (getUnprefixed(prop)) {

							real_name = getUnprefixed(prop);
							cur = this[prop];
							used_props[real_name] = true;
							result.push({
								nesting_name: real_name,
								subpages_names_list: cur[0],
								preload: cur[1],
								init_state_name: cur[2]
							});
						}
					}
				}

				if (has_pack) {
					for (real_name in this.nest) {
						if (used_props[real_name]) {
							continue;
						}
						cur = this.nest[real_name];
						used_props[real_name] = true;
						result.push({
							nesting_name: real_name,
							subpages_names_list: cur[0],
							preload: cur[1],
							init_state_name: cur[2]
						});
					}
				}

				this.nestings_declarations = result;

			}



		};
	})(),
	changeDataMorphDeclarations: (function() {
		var getUnprefixed = spv.getDeprefixFunc( 'nest_req-', true );
		var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );
		return function(props) {
			var i, cur;


			var has_changes = false;

			if (props.hasOwnProperty('req_map')) {
				this.netsources_of_states = {
					api_names: [],
					api_names_converted: false,
					sources_names: []
				};
				has_changes = true;
				for (i = 0; i < props.req_map.length; i++) {
					cur = props.req_map[i][1];
					if (typeof cur != 'function') {
						props.req_map[i][1] = spv.mmap( cur );
					}
					changeSources(this.netsources_of_states, props.req_map[i][2]);

				}

			}

			var has_reqnest_decls = hasPrefixedProps(props);

			if (has_reqnest_decls) {
				this.has_reqnest_decls = true;
				this.netsources_of_nestings = {
					api_names: [],
					api_names_converted: false,
					sources_names: []
				};
				has_changes = true;
				for (var prop_name in props) {
					if (props.hasOwnProperty(prop_name) && getUnprefixed(prop_name) ) {
						cur = props[ prop_name ];
						if (typeof cur[0][0] != 'function') {
							cur[0][0] = spv.mmap(cur[0][0]);
						}
						if (cur[0][1] && cur[0][1] !== true && typeof cur[0][1] != 'function') {
							cur[0][1] = spv.mmap(cur[0][1]);
						}
						var array = cur[0][2];
						if (array) {
							for (i = 0; i < array.length; i++) {
								var spec_cur = array[i];
								if (typeof spec_cur[1] != 'function') {
									spec_cur[1] = spv.mmap(spec_cur[1]);
								}
							}
						}
						changeSources(this.netsources_of_nestings, cur[1]);

					}
				}
			}
			if (has_changes) {
				this.netsources_of_all = {
					nestings: this.netsources_of_nestings,
					states: this.netsources_of_states
				};
			}
		};
	})(),
	getNetworkSources: function() {
		if (!this.netsources_of_all) {
			return;
		}
		if (!this.netsources_of_all.done) {
			this.netsources_of_all.done = true;
			this.netsources_of_all.full_list = [];

			if (this.netsources_of_all.nestings) {
				changeSourcesByApiNames(this, this.netsources_of_all.nestings);
				push.apply(this.netsources_of_all.full_list, this.netsources_of_all.nestings.sources_names);
			}

			if (this.netsources_of_all.states) {
				changeSourcesByApiNames(this, this.netsources_of_all.states);
				push.apply(this.netsources_of_all.full_list, this.netsources_of_all.states.sources_names);
			}
		}

		return this.netsources_of_all.full_list;
	},
	'regfr-childchev': (function() {
		var getNestingName = spv.getDeprefixFunc('child_change-');
		return {
			test: function(namespace) {

				return getNestingName(namespace);
			},
			fn: function(namespace) {
				var nesting_name = getNestingName(namespace);
				var child = this.getNesting(nesting_name);
				if (child){
					return {
						value: child,
						target: this,
						nesting_name: nesting_name
					};
				}
			},
			getWrapper: function() {
				return hp.oop_ext.hndMotivationWrappper;
			},
			getFSNamespace: function(namespace) {
				return getNestingName(namespace);
			},
			handleFlowStep: stackNestingFlowStep
		};
	})(),
	getStrucRoot: function() {
		return this.app;
	},
	getStrucParent: function() {
		return this.map_parent;
	},
	getSiOpts: function() {
		return getSiOpts(this);
	},
	initSi: function(Constr, data, params) {
		var instance = new Constr();
		var initsbi_opts = this.getSiOpts();

		this.useMotivator(instance, function(instance) {
			instance.init(initsbi_opts, data, params);
		});

		return instance;
	},
	init: modelInitM,
	removeNestWatch: function(nwatch, skip) {
		if (nwatch.selector.length == skip) {
			if (!nwatch.items_index) {
				return;
			}

			nwatch.items_index[this._provoda_id] = null;
			nwatch.items_changed = true;
			if (nwatch.one_item_mode && nwatch.one_item == this) {
				nwatch.one_item = null;
			}

			if (this.states_links && this.states_links[nwatch.state_name]) {
				this.states_links[nwatch.state_name] = spv.findAndRemoveItem(this.states_links[nwatch.state_name], nwatch);
			}
			// console.log('full match!', this, nwa);
		} else {
			var nesting_name = nwatch.selector[skip];
			if (this.nes_match_index && this.nes_match_index[nesting_name]) {
				this.nes_match_index[nesting_name] = spv.findAndRemoveItem(this.nes_match_index[nesting_name], nwatch);
				// this.nes_match_index[nesting_name].remoVe();
			}
		}

	},
	addNestWatch: (function() {
		var SublWtch = function(nwatch, skip, id) {
			this.holder_id = id;
			this.nwatch = nwatch;
			this.skip = skip;
		};
		return function(nwatch, skip) {
			if (!this.nes_match_handeled) {
				this.nes_match_handeled = {};
			}
			if (!this.nes_match_handeled[nwatch.num]) {
				this.nes_match_handeled[nwatch.num] = true;
			} else {
				return;
			}

			if (nwatch.selector.length == skip) {
				// console.log('full match!', this, nwatch);
				if (!nwatch.items_index) {
					nwatch.items_index = {};
				}
				nwatch.items_index[this._provoda_id] = this;
				nwatch.items_changed = true;
				if (nwatch.one_item_mode) {
					nwatch.one_item = this;
				}
				if (!this.states_links) {
					this.states_links = {};
				}
				if (!this.states_links[nwatch.state_name]) {
					this.states_links[nwatch.state_name] = [];
				}
				this.states_links[nwatch.state_name].push(nwatch);

			} else {
				if (!this.nes_match_index) {
					this.nes_match_index = {};
				}

				var nesting_name = nwatch.selector[skip];
				if (!this.nes_match_index[nesting_name]) {
					this.nes_match_index[nesting_name] = [];
				}
				this.nes_match_index[nesting_name].push(new SublWtch(nwatch, skip));


				if (this.children_models) {
					for (var nesting_name in this.children_models) {
						checkNestWatchs(this, nesting_name, this.children_models[nesting_name]);
					}
				}
			}

		};
	})(),
	mapStates: function(states_map, donor, acceptor) {
		if (acceptor && typeof acceptor == 'boolean'){
			if (this.init_states === false) {
				throw new Error('states inited already, you can\'t init now');
			}
			if (!this.init_states) {
				this.init_states = {};
			}
			acceptor = this.init_states;
		}
		return spv.mapProps(states_map, donor, acceptor);
	},
	initState: function(state_name, state_value) {
		if (this.init_states === false) {
			throw new Error('states inited already, you can\'t init now');
		}
		if (this.hasComplexStateFn(state_name)) {
			throw new Error("you can't change complex state " + state_name);
		}

		if (!this.init_states) {
			this.init_states = {};
		}
		this.init_states[state_name] = state_value;
	},
	initStates: function(more_states) {
		if (this.init_states === false) {
			throw new Error('states inited already, you can\'t init now');
		}

		if (more_states) {
			if (!this.init_states) {
				this.init_states = {};
			}
			cloneObj(this.init_states, more_states);
		}

		var changes_list = getComplexInitList(this) || this.init_states && [];

		if (this.init_states) {
			for (var state_name in this.init_states) {
				if (!this.init_states.hasOwnProperty(state_name)) {
					continue;
				}

				if (this.hasComplexStateFn(state_name)) {
					throw new Error("you can't change complex state " + state_name);
				}

				changes_list.push(true, state_name, this.init_states[state_name]);
			}
		}

		if (changes_list && changes_list.length) {
			updateProxy(this, changes_list);
		}

		// this.updateManyStates(this.init_states);
		this.init_states = false;
	},
	network_data_as_states: true,
	onExtend: (function() {
		var check = /initStates/gi;
		var baseInit = modelInitM;
		return spv.precall(StatesEmitter.prototype.onExtend, function(props, original) {
			if (props.init && props.init !== baseInit) {
				if (!this.hasOwnProperty('network_data_as_states')) {
					this.network_data_as_states = false;
				}

				if (props.init.toString().search(check) != -1) {
					this.manual_states_init = true;
				}
			}
		});
	})(),
	getConstrByPathTemplate: function(app, path_template) {
		return initDeclaredNestings.getConstrByPath(app, this, path_template);
	},
	connectMPX: function() {
		if (!this.mpx) {
			this.mpx = new MDProxy(this._provoda_id, this.states, this.children_models, this);
		}
		return this.mpx;
	},

	getReqsOrderField: function() {
		if (!this.req_order_field) {
			this.req_order_field = ['mdata', 'm', this._provoda_id, 'order'];
		}
		return this.req_order_field;
	},
	getMDReplacer: function() {
		if (!this.md_replacer) {
			var MDReplace = function(){};
			MDReplace.prototype.md = this;
			MDReplace.prototype.getMD = getMDOfReplace;

			this.md_replacer = new MDReplace();
			this.md_replacer._provoda_id = this._provoda_id;
		}
		return this.md_replacer;
	},
	RPCLegacy: function() {
		var args = Array.prototype.slice.call(arguments);
		var method_name = args.shift();
		if (this.rpc_legacy && this.rpc_legacy[method_name]){
			this.rpc_legacy[method_name].apply(this, args);
		} else {
			this[method_name].apply(this, args);

		}
	},
	die: function(){
		this.stopRequests();
		//this.mpx.die();
		views_proxies.killMD(this);
		hp.triggerDestroy(this);
		big_index[this._provoda_id] = null;
		return this;
	}
});



var passCollectionsChange = function(e) {
	this.setItems(e.value, e.target.current_motivator);
};


var removeNestWatchs = function(item, array, one) {
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			cur.nwatch.one_item_mode = !!one;
			item.removeNestWatch(cur.nwatch, cur.skip + 1);
		}
};

var addNestWatchs = function(item, array, one) {
	for (var i = 0; i < array.length; i++) {
		var cur = array[i];
		cur.nwatch.one_item_mode = !!one;
		item.addNestWatch(cur.nwatch, cur.skip + 1);
	}
};

function checkNestWatchs(md, collection_name, array, removed) {
	if (md.nes_match_index && md.nes_match_index[collection_name]) {
		// console.log('match!', collection_name);
		var nwats = md.nes_match_index[collection_name];

		if (Array.isArray(removed)) {
			for (var i = 0; i < removed.length; i++) {
				if (!removed[i]) {continue;}
				removeNestWatchs(removed[i], nwats);
			}
		} else if (removed){
			removeNestWatchs(array, nwats, true);
		}


		if (Array.isArray(array)) {
			for (var i = 0; i < array.length; i++) {
				if (!array[i]) {continue;}
				addNestWatchs(array[i], nwats);
			}
		} else if(array) {
			addNestWatchs(array, nwats, true);
		}
	}
}

function checkChangedNestWatchs(md, collection_name) {
	if (md.nes_match_index && md.nes_match_index[collection_name]) {
		// console.log('match!', collection_name);
		var nwats = md.nes_match_index[collection_name];

		var result = [];
		for (var i = 0; i < nwats.length; i++) {
			var cur = nwats[i].nwatch;
			if (cur.items_changed) {
				result.push(cur);
				// console.log(cur.selector, cur);
			}

		}

		return result.length && result;
	}
}


add({
	watchChildrenStates: function(collection_name, state_name, callback) {
		//
		var items_events = new ItemsEvents( hp.getSTEVNameDefault(state_name), this, callback);
		this.on(hp.getFullChilChEvName(collection_name), passCollectionsChange, null, items_events);
	},
	archivateChildrenStates: function(collection_name, collection_state, statesCalcFunc, result_state_name) {
		var archiver = new StatesArchiver(collection_state, result_state_name || collection_state, this, statesCalcFunc);
		this.on(hp.getFullChilChEvName(collection_name), passCollectionsChange, null, archiver);
	},
	getRelativeRequestsGroups: function(space, only_models) {
		var all_models = [];
		var groups = [];

		var i = 0, cur = null;
		for (var collection_name in this.children_models){
			cur = this.children_models[collection_name];
			if (!cur) {
				continue;
			}
			if (Array.isArray(cur)){
				all_models.push.apply(all_models, cur);
			} else {
				all_models.push(cur);
			}
		}
		var clean_models = spv.getArrayNoDubs(all_models);

		if (only_models){
			return clean_models;
		} else {
			for (i = 0; i < clean_models.length; i++) {
				var reqs = clean_models[i].getModelImmediateRequests(space);
				if (reqs && reqs.length){
					groups.push(reqs);
				}
			}
			return groups;
		}
	},
	getNesting: function(collection_name) {
		return this.children_models && this.children_models[collection_name];
	},

	updateNesting: function(collection_name, array, opts, spec_data) {
		if (collection_name.indexOf('.') != -1){
			throw new Error('remove "." (dot) from name');
		}

		var zdsv = this.zdsv;
		if (zdsv) {
			zdsv.abortFlowSteps('collch', collection_name);
		}

		if (Array.isArray(array)){
			array = array.slice(0);
		}
		if (!this.children_models) {
			this.children_models = {};
		}

		var old_value = this.children_models[collection_name];
		this.children_models[collection_name] = array;

		if (old_value && array) {
			var arr1 = Array.isArray(old_value);
			var arr2 = Array.isArray(array);
			if (arr1 != arr2) {
				throw new Error('nest type must be stable');
			}
		}

		var removed = hp.getRemovedNestingItems(array, old_value);

		checkNestWatchs(this, collection_name, array, removed);

		var changed_nawchs = checkChangedNestWatchs(this, collection_name);
		//var calls_flow = (opts && opts.emergency) ? main_calls_flow : this.sputnik._getCallsFlow();
		var calls_flow = this._getCallsFlow();
		if (changed_nawchs) {
			for (var i = 0; i < changed_nawchs.length; i++) {
				var cur = changed_nawchs[i];

				calls_flow.pushToFlow(null, null, null, cur, cur.handler, null, this.current_motivator);

			}

		}


		// !?



		var full_ev_name = hp.getFullChilChEvName(collection_name);

		var chch_cb_cs = this.evcompanion.getMatchedCallbacks(full_ev_name);

		if (chch_cb_cs.length) {
			if (!this.zdsv) {
				this.zdsv = new StatesLabour(!!this.full_comlxs_index, this._has_stchs);
				//debugger;
			}
			zdsv = this.zdsv;
			var flow_steps = zdsv.createFlowStepsArray('collch', collection_name);


			var event_obj = {
				value: null,
				old_value: null,
				target: null,
				nesting_name: collection_name
			};
			if (typeof opts == 'object'){
				cloneObj(event_obj, opts);
			}
			//opts = opts || {};
			event_obj.value = array;
			event_obj.old_value = old_value;
			event_obj.target = this;
			//this.trigger(full_ev_name, event_obj);

			this.evcompanion.triggerCallbacks(chch_cb_cs, false, false, full_ev_name, event_obj, flow_steps);

			hp.markFlowSteps(flow_steps, 'collch', collection_name);

		}










		if (!opts || !opts.skip_report){
			this.sendCollectionChange(collection_name, array, old_value, removed);
		}

		return this;
	},
	sendCollectionChange: function(collection_name, array, old_value, removed) {
		//this.removeDeadViews();
		sync_sender.pushNesting(this, collection_name, array, old_value, removed);
		views_proxies.pushNesting(this, collection_name, array, old_value, removed);
		if (this.mpx) {
			this.mpx.sendCollectionChange(collection_name, array, old_value, removed);
		}
	},

	sendStatesToMPX: function(states_list) {
		//this.removeDeadViews();
		var dubl = states_list.slice();
		sync_sender.pushStates(this, dubl);
		views_proxies.pushStates(this, dubl);
		if (this.mpx) {
			this.mpx.stackReceivedStates(dubl);
		}
		//
	}});




	var getLinedStructure;
	(function() {
		var checkModel = function(md, models_index, local_index, all_for_parse) {
			if (!md) {
				return;
			}
			var cur_id = md._provoda_id;
			if (typeof cur_id == 'undefined') {
				return;
			}
			if (!models_index[cur_id] && !local_index[cur_id]){
				local_index[cur_id] = true;
				all_for_parse.push(md);
			}
			return cur_id;
		};

		getLinedStructure = function(models_index, local_index) {
			//используется для получения массива всех РЕАЛЬНЫХ моделей, связанных с текущей
			local_index = local_index || {};
			models_index = models_index || {};
			var big_result_array = [];
			var all_for_parse = [this];





			while (all_for_parse.length) {
				var cur_md = all_for_parse.shift();
				var can_push = !models_index[cur_md._provoda_id];
				if (can_push) {
					models_index[cur_md._provoda_id] = true;
				}
				checkModel(cur_md.map_parent, models_index, local_index, all_for_parse);


				for (var state_name in cur_md.states){
					checkModel(cur_md.states[state_name], models_index, local_index, all_for_parse);

				}

				for (var nesting_name in cur_md.children_models){
					var cur = cur_md.children_models[nesting_name];
					if (cur){
						if (cur._provoda_id){
							checkModel(cur, models_index, local_index, all_for_parse);
						} else {
							var array;
							if (Array.isArray(cur)){
								array = cur;
							} else {
								array = spv.getTargetField(cur, 'residents_struc.all_items');
								if (!array) {
									throw new Error('you must provide parsable array in "residents_struc.all_items" prop');
								}
							}
							for (var i = 0; i < array.length; i++) {
								checkModel(array[i], models_index, local_index, all_for_parse);
							}
						}
					}
				}


				if (can_push) {
					big_result_array.push(cur_md);
				}
			}

			return big_result_array;

		};
	})();


	var toSimpleStructure;
	(function() {
		var checkModel = function(md, models_index, local_index, all_for_parse) {
			var cur_id = md._provoda_id;
			if (!models_index[cur_id] && !local_index[cur_id]){
				local_index[cur_id] = true;
				all_for_parse.push(md);
			}
			return cur_id;
		};

		toSimpleStructure = function(models_index, big_result) {
			//используется для получения массива всех ПОДДЕЛЬНЫХ, пригодных для отправки через postMessage моделей, связанных с текущей
			models_index = models_index || {};
			var local_index = {};
			var all_for_parse = [this];
			big_result = big_result || [];



			while (all_for_parse.length) {
				var cur_md = all_for_parse.shift();
				var can_push = !models_index[cur_md._provoda_id];
				if (can_push) {
					models_index[cur_md._provoda_id] = true;
				}

				var result = {
					_provoda_id: cur_md._provoda_id,
					model_name: cur_md.model_name,
					states: cloneObj({}, cur_md.states),
					map_parent: cur_md.map_parent && checkModel(cur_md.map_parent, models_index, local_index, all_for_parse),
					children_models: {},
					map_level_num: cur_md.map_level_num,
					mpx: null
				};
				for (var state_name in result.states){
					var state = result.states[state_name];
					if (state && state._provoda_id){
						result.states[state_name] = {
							_provoda_id: checkModel(state, models_index, local_index, all_for_parse)
						};
					}
				}

				for (var nesting_name in cur_md.children_models){
					var cur = cur_md.children_models[nesting_name];
					if (cur){
						if (cur._provoda_id){
							result.children_models[nesting_name] = checkModel(cur, models_index, local_index, all_for_parse);
						} else {

							var array = new Array(cur.length);
							for (var i = 0; i < cur.length; i++) {
								array[i] = checkModel(cur[i], models_index, local_index, all_for_parse);
							}
							result.children_models[nesting_name] = array;
						}
					}
				}
				if (can_push) {
					big_result.push(result);
				}

			}


			return big_result;
		};
	})();

add({
	getLinedStructure: getLinedStructure ,
	toSimpleStructure: toSimpleStructure
});
});
return Model;
};
});
