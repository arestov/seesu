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
var initNestWatchers = require('./nest-watch/index').init;
var checkNesting =  require('./nest-watch/index').checkNesting;
var _requestsDeps = require('./Model/_requestsDeps');
var onPropsExtend = require('./Model/onExtend');
var pvUpdate = updateProxy.update;

var push = Array.prototype.push;
var cloneObj = spv.cloneObj;

var getComplexInitList = updateProxy.getComplexInitList;

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

function postInitModel(self) {
  // prefill own states before connecting relations
  self.__initStates();

  prsStCon.connect.parent(self);
  prsStCon.connect.root(self);
  prsStCon.connect.nesting(self);

  if (self.nestings_declarations) {
    self.nextTick(initDeclaredNestings, null, false, self.current_motivator);
  }

  initNestWatchers(self);

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
}

var modelInit = (function() {
  function toServStates(self, states) {
    if (!states) {return;}

    if (!self.init_service_states) {
      self.init_service_states = {};
    }

    cloneObj(self.init_service_states, states);
  }
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

		self._provoda_id = self._highway.models_counters++;
		self._highway.models[self._provoda_id] = self;

		//self.states = {};

		self.children_models = null;
		self._network_source = self._network_source || null;


		self.md_replacer = null;
		self.mpx = null;
    self._requests_deps = null;

		self.init_states = self.init_states || null;

		self.init_service_states = null;

		if (states || (data && data.states)) {

			toServStates(self, states);
      toServStates(self, data && data.states);
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
      toServStates(self, data.network_states);

			if (self.net_head) {
				if (!self.head) {self.head = {};}
				for (var i = 0; i < self.net_head.length; i++) {
					var pk = self.net_head[i];
					self.head[pk] = data.network_states[pk];
				}
			}
		}

		if (self.head) {
      toServStates(self, self.head);
		}

    if (!self.init_service_states) {
      return self;
    }

    for (var state_name in self.init_service_states) {
      if (self.hasComplexStateFn(state_name)) {
        delete self.init_service_states[state_name];
      }
    }

    self.init_states = self.init_states || {};

    cloneObj(self.init_states, self.init_service_states);
		self.init_service_states = null;


		return self;
	};
})();

var Model = spv.inh(StatesEmitter, {
	naming: function(fn) {
		return function Model(opts, data, params, more, states) {
			fn(this, opts, data, params, more, states);
		};
	},
	onExtend: onPropsExtend,
	init: modelInit,
  postInit: postInitModel,
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
	initChi: function(name, data, params, more, states) {
		var Constr = this._all_chi['chi-' + name];
		return this.initSi(Constr, data, params, more, states);
	},
	initSi: function(Constr, data, params, more, states) {
		if (Constr.prototype.conndst_parent && Constr.prototype.conndst_parent.length) {
			if (Constr.prototype.pconstr_id !== true && this.constr_id !== Constr.prototype.pconstr_id) {
				console.log( (new Error('pconstr_id should match constr_id')).stack );
			}
		}

		if (Constr.prototype.init) {
			var instance = new Constr();
			var initsbi_opts = this.getSiOpts();

			this.useMotivator(instance, function(instance) {
				instance.init(initsbi_opts, data, params, more, states);
			});

			return instance;
		} else {
			var motivator = this.current_motivator;

			var opts = {
				_motivator: motivator,
				map_parent: this != this.app && this,
				app: this.app
			};

			var instancePure = new Constr(opts, data, params, more, states);

			instancePure.current_motivator = null;

			return instancePure;
		}

	},
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
  initStates: function (more_states) {
    if (!more_states) {
      return;
    }

    if (this.init_states === false) {
			throw new Error('states inited already, you can\'t init now');
		}

    if (!this.init_states) {
      this.init_states = {};
    }
    cloneObj(this.init_states, more_states);
  },
	__initStates: function() {
		if (this.init_states === false) {
			throw new Error('states inited already, you can\'t init now');
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

		prsStCon.prefill.parent(this, changes_list);
		prsStCon.prefill.root(this, changes_list);

		if (changes_list && changes_list.length) {
			updateProxy(this, changes_list);
		}

		// this.updateManyStates(this.init_states);
		this.init_states = false;
	},
	network_data_as_states: true,
	onExtend: spv.precall(StatesEmitter.prototype.onExtend, function (props, original, params) {
		onPropsExtend(this, props, original, params);
	}),
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
		checkNesting(this, collection_name, array, removed);
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

		var count = Array.isArray(array)
			? array.length
			: (array ? 1 : 0);

		pvUpdate(this, collection_name + '$length', count);
		pvUpdate(this, collection_name + '$exists', Boolean(count));

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
