define(function(require) {
'use strict';

var spv = require('spv');
var StatesLabour = require('./StatesLabour');
var hp = require('./helpers');
var MDProxy = require('./MDProxy');
var initDeclaredNestings = require('./initDeclaredNestings');
var prsStCon = require('./prsStCon');
var updateProxy = require('./updateProxy');
var StatesEmitter = require('./StatesEmitter');
var LocalWatchRoot = require('./Model/LocalWatchRoot');
var constr_mention = require('./structure/constr_mention');
var _requestsDeps = require('./Model/_requestsDeps');

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
				cur.evcompanion.off(opts.ev_name, opts.cb, opts);
			}
		}
	}
	return index;
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

var changeSources = function(store, send_declr) {
	var api_name = send_declr.api_name;
	if (typeof api_name == 'string') {
		store.api_names.push(api_name);
	} else {
		var network_api = api_name.call();
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

var modelInit = (function() {
	return function initModel(self, opts, data, params, more, states) {
		self.current_motivator = self.current_motivator || (opts && opts._motivator);

		if (opts && opts.app){
			self.app = opts.app;
		}

		self.app = self.app || null;

		if (opts._highway) {
			self._highway = opts._highway;
		}

		if (!self._highway) {
			self._highway = self.app._highway;
		}

		self._highway = self._highway || null;

		self._calls_flow = self._highway.calls_flow;

		self.sub_pages = null;

		if (self._sub_pages || self._sub_pager){
			self.sub_pages = {};
		}

		if (opts && opts.map_parent){
			self.map_parent = opts.map_parent;
		}

		self.map_parent = self.map_parent || null;

		self.req_order_field = null;
		self.states_links = null;

		self._provoda_id = self._highway.models_counters++;
		self._highway.models[self._provoda_id] = self;

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
			self.nextTick(initDeclaredNestings, null, false, self.current_motivator);
		}

		self._requests_deps = null;
		self.nes_match_index = null;

		if (self.nest_match) {
			for (var i = 0; i < self.nest_match.length; i++) {
				self.addNestWatch(new LocalWatchRoot(self, self.nest_match[i]), 0);
			}
		}

		if (!self.manual_states_init) {
			self.initStates();
		}


		if (self.__apis_$_usual && self.__apis_$_usual.length) {
			for (var i = 0; i < self.__apis_$_usual.length; i++) {
				var cur = self.__apis_$_usual[i];
				self.useInterface(cur.name, cur.fn());
			}
		}

		if (self.__api_root_dep_apis) {
			for (var i = 0; i < self.__api_root_dep_apis.length; i++) {
				var cur = self.__api_root_dep_apis[i];
				var api = self.app._interfaces_using.used[cur]
				self.useInterface('#' + cur, api);
			}
		}

		if (self.__api_effects_$_index_by_apis && self.__api_effects_$_index_by_apis['self']) {
			self.useInterface('self', self);
		}

		return self;
	};
})();

var onPropsExtend = (function(){
	var check = /initStates/gi;
	return function(props, original, params) {
		var init = params && params.init || props.init;
		if (init) {
			if (init.length > 2 && !this.hasOwnProperty('network_data_as_states')) {
				this.network_data_as_states = false;
			}
			if (init.toString().search(check) != -1) {
				this.manual_states_init = true;
			}
		}
	};
})();

var Model = spv.inh(StatesEmitter, {
	naming: function(fn) {
		return function Model(opts, data, params, more, states) {
			fn(this, opts, data, params, more, states);
		};
	},
	skip_first_extend: true,
	onExtend: function(md, props, original, params) {
		onPropsExtend.call(md, props, original, params);
	},
	init: modelInit,
	props: modelProps
});

function modelProps(add) {
add(_requestsDeps);
add({
	getNonComplexStatesList: function(state_name) {
		// get source states
		var short_name = hp.getShortStateName(state_name);

		if (!this.hasComplexStateFn(short_name)) {
			return short_name;
		} else {
			var result = [];
			for (var i = 0; i < this.compx_check[short_name].watch_list.length; i++) {
				var cur = this.compx_check[short_name].watch_list[i];
				if (cur == short_name) {
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
		var network_api = dclt && hp.getNetApiByDeclr(dclt.send_declr, this, app);
		return network_api && network_api.source_name;
	},
	getStateSources: function(state_name, app) {
		var parsed_state = hp.getEncodedState(state_name);
		if (parsed_state && parsed_state.rel_type == 'nesting') {
			return this.getNestingSource(parsed_state.nesting_name, app);
		} else {
			var maps_for_state = this._states_reqs_index && this._states_reqs_index[state_name];
			if (maps_for_state) {
				var result = new Array(maps_for_state.length);
				for (var i = 0; i < maps_for_state.length; i++) {
					var selected_map = maps_for_state[i];
					var network_api = hp.getNetApiByDeclr(selected_map.send_declr, this, app);
					result[i] = network_api.source_name;
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

		var declarationConstructor = constr_mention.declarationConstructor;

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
								subpages_names_list: declarationConstructor(cur[0], 'nest-' + real_name),
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
							subpages_names_list: declarationConstructor(cur[0], 'nest-' + real_name),
							preload: cur[1],
							init_state_name: cur[2]
						});
					}
				}

				this.nestings_declarations = result;
				this.idx_nestings_declarations = {};
				this._chi_nest = {};
				for (var i = 0; i < result.length; i++) {
					this.idx_nestings_declarations[result[i].nesting_name] = result[i];

					var item = result[i].subpages_names_list;
					if (Array.isArray(item)) {
						for (var kk = 0; kk < item.length; kk++) {
							if (item[kk].type == 'constr') {
								this._chi_nest[item[kk].key] = item[kk].value;
							}
						}
					} else {
						if (item.type == 'constr') {
							this._chi_nest[item.key] = item.value;
						}
					}

				}


			}



		};
	})(),
	changeDataMorphDeclarations: (function() {
		var getUnprefixed = spv.getDeprefixFunc( 'nest_req-' );
		var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

		var apiDeclr = spv.memorize(function(name) {
			var parts = name.split('.');
			return {
				name: parts[0],
				resource_path: parts.length > 1 ? parts.slice(1) : null
			};
		});

		var counter = 1;

		function SendDeclaration(declr) {
			this.id = counter++;
			this.api_name = null;
			this.api_resource_path = null;

			if (typeof declr[0] == 'function') {
				this.api_name = declr[0];
			} else {
				var api_declr = apiDeclr(declr[0]);
				this.api_name = api_declr.name;
				this.api_resource_path = api_declr.resource_path;
			}

			this.api_method_name = null;
			this.manual = null;
			this.ids_declr = null;

			if (typeof declr[1] =='string') {
				this.api_method_name = declr[1];
			} else if (Array.isArray(declr[1])) {
				var manual = declr[1];
				this.manual = {
					dependencies: manual[0],
					fn: manual[1],
					fn_body: manual[1].toString()
				};
			} else if (declr[1].arrayof) {
				this.ids_declr = declr[1];
				this.ids_declr.fn_body = this.ids_declr.req.toString();
			}

			this.getArgs = declr[2];
			this.non_standart_api_opts = declr[3];
		}

		function ReqMap(req_item, num) {
			this.num = num;
			this.dependencies = null;
			this.send_declr = null;
			var relations = req_item[0];
			if (Array.isArray(relations[0])) {
				throw new Error('wrong');
			} else {
			}

			this.states_list = relations;

			var parse;
			if (typeof req_item[1] != 'function') {
				parse = spv.mmap( req_item[1] );
			} else {
				parse = req_item[1];
			}
			this.parse = parse;
			var send_declr = req_item[2];

			if (!Array.isArray(send_declr[0])) {
				this.send_declr = new SendDeclaration(send_declr);
			} else {
				this.dependencies = send_declr[0];
				this.send_declr = new SendDeclaration(send_declr[1]);
			}
		}

		function stateName(name) {
			return '$__can_load_' + name;
		}

		function NestReqMap(dclt, name) {

			if (typeof dclt[0][0] != 'function') {
				dclt[0][0] = spv.mmap(dclt[0][0]);
			}
			if (dclt[0][1] && dclt[0][1] !== true && typeof dclt[0][1] != 'function') {
				dclt[0][1] = spv.mmap(dclt[0][1]);
			}
			var array = dclt[0][2];
			if (array) {
				for (var i = 0; i < array.length; i++) {
					var spec_cur = array[i];
					if (typeof spec_cur[1] != 'function') {
						spec_cur[1] = spv.mmap(spec_cur[1]);
					}
				}
			}
			this.original = this;
			this.nest_name = name;
			this.parse_items = dclt[0][0];
			this.parse_serv = dclt[0][1];
			this.side_data_parsers = dclt[0][2];
			this.send_declr = null;
			this.dependencies = null;
			this.state_dep = null;

			var send_declr = dclt[1];
			if (!Array.isArray(send_declr[0])) {
				this.send_declr = new SendDeclaration(send_declr);
			} else {
				this.dependencies = send_declr[0];
				this.send_declr = new SendDeclaration(send_declr[1]);
			}


			if (this.dependencies) {
				this.state_dep = stateName(this.nest_name);
			}

		}

		function NestReqMapCopy(nest_declr, is_main) {
			this.original = nest_declr;

			this.nest_name = nest_declr.nest_name;
			this.parse_items = nest_declr.parse_items;
			this.parse_serv = nest_declr.parse_serv;
			this.side_data_parsers = nest_declr.side_data_parsers;
			this.send_declr = nest_declr.send_declr;
			this.dependencies = nest_declr.dependencies;
			this.state_dep = nest_declr.state_dep;

			if (!is_main) {
				return;
			}

			var more = ['can_load_data'];
			this.dependencies = !this.dependencies
				? more
				: this.dependencies.concat(more);

			this.state_dep = stateName(this.nest_name);

		}

		var doIndex = function(list, value) {
			var result = [];

			for (var i = 0; i < list.length; i++) {
				var states_list = list[i].states_list;
				if (states_list.indexOf(value) != -1) {
					result.push(list[i]);
				}
			}

			return result;
		};

		var assign = function(md, props, nest_declr) {
			var key = 'compx-' + nest_declr.state_dep;
			md[key] = props[key] = [nest_declr.dependencies, spv.hasEveryArgs];
		};

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

				var list = new Array(props.req_map.length);
				for (var i = 0; i < props.req_map.length; i++) {
					list[i] = new ReqMap(props.req_map[i], i);
				}
				for (var i = 0; i < list.length; i++) {
					changeSources(this.netsources_of_states, list[i].send_declr);

				}

				this._states_reqs_index = {};
				var states_index = {};

				for (var i = 0; i < list.length; i++) {
					var states_list = list[i].states_list;
					for (var jj = 0; jj < states_list.length; jj++) {
						states_index[states_list[jj]] = true;
					}
				}
				for (var state_name in states_index) {
					this._states_reqs_index[state_name] = doIndex(list, state_name);
				}
			}

			var has_reqnest_decls = hasPrefixedProps(props);

			var main_list_nest_req = this.main_list_nest_req;

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
						var nest_name = getUnprefixed(prop_name);
						var nest_declr = new NestReqMap(props[ prop_name ], nest_name);

						changeSources(this.netsources_of_nestings, nest_declr.send_declr);

						var is_main = nest_name == this.main_list_name;
						// if (is_main) {
						// 	debugger;
						// }
						var cur_nest = !is_main ? nest_declr : new NestReqMapCopy(nest_declr, is_main);
						this[prop_name] = cur_nest;

						if (!cur_nest.state_dep) {
							continue;
						}

						assign(this, props, cur_nest);

						if (!is_main) {
							continue;
						}

						this.main_list_nest_req = cur_nest;
					}
				}
			}

			if (props.hasOwnProperty('main_list_nest_req') && main_list_nest_req && main_list_nest_req.nest_name !== props.main_list_name) {
				assign(this, props, main_list_nest_req.original);
				this['nest_req-' + main_list_nest_req.nest_name] = main_list_nest_req.original;
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
	initChi: function(name, data, params) {
		var Constr = this._all_chi['chi-' + name];
		return this.initSi(Constr, data, params);
	},
	initSi: function(Constr, data, params) {
		if (Constr.prototype.conndst_parent && Constr.prototype.conndst_parent.length) {
			if (Constr.prototype.pconstr_id !== true && this.constr_id !== Constr.prototype.pconstr_id) {
				console.log( (new Error('pconstr_id should match constr_id')).stack );
			}
		}

		if (Constr.prototype.init) {
			var instance = new Constr();
			var initsbi_opts = this.getSiOpts();

			this.useMotivator(instance, function(instance) {
				instance.init(initsbi_opts, data, params);
			});

			return instance;
		} else {
			var motivator = this.current_motivator;

			var opts = {
				_motivator: motivator,
				map_parent: this != this.app && this,
				app: this.app
			};

			var instancePure = new Constr(opts, data, params);

			instancePure.current_motivator = null;

			return instancePure;
		}

	},
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

			if (this.states_links && this.states_links[nwatch.short_state_name]) {
				this.states_links[nwatch.short_state_name] = spv.findAndRemoveItem(this.states_links[nwatch.short_state_name], nwatch);
			}
			// console.log('full match!', this, nwa);
		} else {
			var nesting_name = nwatch.selector[skip];
			if (this.nes_match_index && this.nes_match_index[nesting_name]) {
				this.nes_match_index[nesting_name] = spv.findAndRemoveItem(this.nes_match_index[nesting_name], nwatch);
				// this.nes_match_index[nesting_name].remoVe();
			}
		}

		var removeHandler = nwatch.removeHandler;
		if (removeHandler) {
			removeHandler(this, nwatch, skip);
		}

	},
	addNestWatch: (function() {
		var SublWtch = function SublWtch(nwatch, skip) {
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
				if (!this.states_links[nwatch.short_state_name]) {
					this.states_links[nwatch.short_state_name] = [];
				}
				this.states_links[nwatch.short_state_name].push(nwatch);

			} else {
				if (!this.nes_match_index) {
					this.nes_match_index = {};
				}

				var nesting_name = nwatch.selector[skip];
				if (!this.nes_match_index[nesting_name]) {
					this.nes_match_index[nesting_name] = [];
				}
				var subl_wtch = new SublWtch(nwatch, skip);

				this.nes_match_index[nesting_name].push(subl_wtch);


				if (this.children_models) {
					for (var nesting_name in this.children_models) {
						checkNestWatchs(this, nesting_name, this.children_models[nesting_name]);
					}
				}
			}

			var addHandler = nwatch.addHandler;
			if (addHandler) {
				addHandler(this, nwatch, skip);
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
	onExtend: spv.precall(StatesEmitter.prototype.onExtend, onPropsExtend),
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
		this._highway.views_proxies.killMD(this);
		hp.triggerDestroy(this);
		this._highway.models[this._provoda_id] = null;
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


var hasDot = spv.memorize(function(nesting_name) {
	return nesting_name.indexOf('.') != -1;
});

add({
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
		if (hasDot(collection_name)){
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
		this._highway.sync_sender.pushNesting(this, collection_name, array, old_value, removed);
		this._highway.views_proxies.pushNesting(this, collection_name, array, old_value, removed);
		if (this.mpx) {
			this.mpx.sendCollectionChange(collection_name, array, old_value, removed);
		}
	},

	sendStatesToMPX: function(states_list) {
		//this.removeDeadViews();
		var dubl = states_list.slice();
		this._highway.sync_sender.pushStates(this, dubl);
		this._highway.views_proxies.pushStates(this, dubl);
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
}

return Model;
});
