define(['spv', './StatesLabour', './helpers', 'jquery'], function(spv, StatesLabour, hp, $) {
'use strict';
return function(Eventor) {
var push = Array.prototype.push;

var connects_store = {};
var getConnector = function(state_name) {
	if (!connects_store[state_name]){
		connects_store[state_name] = function(e) {
			this.updateState(state_name, e.value);
		};
	}
	return connects_store[state_name];
};

var light_con_store = {};
var getLightConnector = function(state_name) {
	if (!light_con_store[state_name]){
		light_con_store[state_name] = function(value) {
			this.updateState(state_name, value);
		};
	}
	return light_con_store[state_name];
};




function StatesEmitter() {}
Eventor.extendTo(StatesEmitter, function(add) {

var iterateChList = function(changes_list, context, cb, zdsv) {
	for (var i = 0; i < changes_list.length; i+=2) {
		cb.call(context, i, changes_list[i], changes_list[i+1], zdsv);
	}
};

var stackStateFlowStep = function(flow_step, state_name) {
	if (!this.zdsv) {
		this.zdsv = new StatesLabour(!!this.full_comlxs_index, this._has_stchs);
		//debugger;
	}
	flow_step.p_space = 'stev';
	flow_step.p_index_key = state_name;
	this.zdsv.createFlowStepsArray('stev', state_name).push(flow_step);
};

var regfr_vipstev = (function() {
	var getState = spv.getDeprefixFunc('vip_state_change-');
	return {
		test: function(namespace) {

			return !!getState(namespace);
		},
		fn: function(namespace) {
			var state_name = getState(namespace);
			return {
				value: this.state(state_name),
				target: this
			};
		},
		getWrapper: function() {
			return hp.oop_ext.hndMotivationWrappper;
		},
		getFSNamespace: function(namespace) {
			return getState(namespace);
		},
		handleFlowStep: stackStateFlowStep
	};

})();

var regfr_stev = (function() {
	var getState = spv.getDeprefixFunc('state_change-');
	return {
		test: function(namespace) {
			return !!getState(namespace);
		},
		fn: function(namespace) {
			var state_name = getState(namespace);
			return {
				value: this.state(state_name),
				target: this
			};
		},
		getWrapper: function() {
			return hp.oop_ext.hndMotivationWrappper;
		},
		getFSNamespace: function(namespace) {
			return getState(namespace);
		},
		handleFlowStep: stackStateFlowStep
	};
})();


var regfr_lightstev = (function() {
	var getState = spv.getDeprefixFunc('lgh_sch-');
	return {
		test: function(namespace) {
			return !!getState(namespace);
		},
		fn: function(namespace) {
			return this.state(getState(namespace));
		},
		getWrapper: function() {
			return hp.oop_ext.hndMotivationWrappper;
		},
		getFSNamespace: function(namespace) {
			return getState(namespace);
		},
		handleFlowStep: stackStateFlowStep
	};
})();



var EvConxOpts = function(context, immediately) {
	this.context = context;
	this.immediately = immediately;
};

var getBaseTreeCheckList = function(start) {
	var i, result = [];
	var chunks_counter = 0;
	var all_items = [null, start];

	while (all_items.length) {
		

		var cur_parent = all_items.shift();
		var cur = all_items.shift();

		cur.parent = cur_parent;
		cur.chunk_num = chunks_counter;

		if (cur.children_by_selector) {
			for (i = cur.children_by_selector.length - 1; i >= 0; i--) {
				all_items.push( cur, cur.children_by_selector[i] );
			}
		}
		
		if (cur.children_by_anchor) {
			for (i = cur.children_by_anchor.length - 1; i >= 0; i--) {
				all_items.push( cur, cur.children_by_anchor[i] );
			}

		}

		result.push( cur );
		chunks_counter++;


	}
	return result;

};

var getStateUpdater = function(em, state_name) {
	if (!em._state_updaters) {
		em._state_updaters = {};
	}
	if (!em._state_updaters.hasOwnProperty(state_name)) {
		em._state_updaters[state_name] = function(value) {
			em.updateState(state_name, value);
		};
	}
	return em._state_updaters[state_name];
};

add({
	onDie: function(cb) {
		this.on('die', cb);
	},
	init: function(){
		this._super();
		this.conx_optsi = null;
		this.conx_opts = null;
		this.zdsv = null;
		this.current_motivator = this.current_motivator || null;

		this._state_updaters = null;
		this._used_interfaces = null;
		this._unuse_interface_instr = null;

		this.states = {};

		//this.collectCompxs();

		return this;
	},
	useInterface: function(interface_name, obj) {
		var old_interface = this._used_interfaces && this._used_interfaces[interface_name];
		if (obj !== old_interface) {
			var unuse = this._unuse_interface_instr && this._unuse_interface_instr[interface_name];
			while (unuse && unuse.length) {
				unuse.shift()();
			}
			if (this._used_interfaces) {
				this._used_interfaces[interface_name] = null;
			}

			if (obj) {
				if (this._interfaces_to_states_index) {
					var use_list = this._interfaces_to_states_index[interface_name];
					if (use_list) {
						if (!this._unuse_interface_instr) {
							this._unuse_interface_instr = {};
						}
						if (!this._unuse_interface_instr[interface_name]) {
							this._unuse_interface_instr[interface_name] = [];
						}
						var unuse_instrs = this._unuse_interface_instr[interface_name];
						for (var i = 0; i < use_list.length; i++) {
							var cur = use_list[i];
							var unuse_cur = cur.fn.call(null, obj, getStateUpdater(this, cur.state_name));
							if (typeof unuse_cur !== 'function') {
								throw new Error('you must provide event unbind func');
							}
							unuse_instrs[i] = unuse_cur;
							//unuse_instrs[i]
							//interface_name[i]
						}
					}
				}
				if (!this._used_interfaces) {
					this._used_interfaces = {};
				}
				this._used_interfaces[interface_name] = obj;
			}
		}
	},
	
	'regfr-vipstev': regfr_vipstev,
	'regfr-stev': regfr_stev,
	'regfr-lightstev': regfr_lightstev,
	getContextOptsI: function() {
		if (!this.conx_optsi){
			this.conx_optsi = new EvConxOpts(this, true);
		}
		return this.conx_optsi;
	},
	getContextOpts: function() {
		if (!this.conx_opts){
			this.conx_opts = new EvConxOpts(this);
		}
		return this.conx_opts;
	},
	_bindLight: function(donor, event_name, cb, immediately) {
		donor.evcompanion._addEventHandler(event_name, cb, this, immediately);

		if (this != donor && this instanceof StatesEmitter){
			this.onDie(function() {
				if (!donor) {
					return;
				}
				donor.off(event_name, cb, false, this);
				donor = null;
				cb = null;
			});
		}
	},
	lwch: function(donor, donor_state, func) {
		this._bindLight(donor, hp.getSTEVNameLight(donor_state), func);
	},
	wlch: function(donor, donor_state, acceptor_state) {
		var event_name = hp.getSTEVNameLight(donor_state);
		var acceptor_state_name = acceptor_state || donor_state;
		var cb = getLightConnector(acceptor_state_name);
		this._bindLight(donor, event_name, cb);


	},
	wch: function(donor, donor_state, acceptor_state, immediately) {
	
		var cb;

		var event_name = immediately ?
			hp.getSTEVNameVIP(donor_state) :
			hp.getSTEVNameDefault(donor_state);

		if (typeof acceptor_state == 'function'){
			cb = acceptor_state;
		} else {
			acceptor_state = acceptor_state || donor_state;
			cb = getConnector(acceptor_state);
			
		}
		this._bindLight(donor, event_name, cb, immediately);
		

		return this;

	},
	onExtend: function(props) {
		if (this.collectStateChangeHandlers){
			this.collectStateChangeHandlers(props);
		}
		var collches_modified;
		if (this.collectCollectionChangeDeclarations){
			collches_modified = this.collectCollectionChangeDeclarations(props);
		}
		this.collectStatesBinders(props);
		this.collectCompxs(props);
		this.collectRegFires(props);

		var base_tree_mofified;
		if (props.hasOwnProperty('base_tree')) {
			base_tree_mofified = true;
			this.base_tree_list = getBaseTreeCheckList(props.base_tree);
		}
		if (collches_modified || base_tree_mofified) {
			this.collectBaseExtendStates();
		}

		if (this.collectNestingsDeclarations) {
			this.collectNestingsDeclarations(props);
		}

		if (this.changeDataMorphDeclarations) {
			this.changeDataMorphDeclarations(props);
		}

		if (this.changeChildrenViewsDeclarations) {
			this.changeChildrenViewsDeclarations(props);
		}

		
		for (var i = 0; i < this.xxxx_morph_props.length; i++) {
			var cur = this.xxxx_morph_props[i];
			var cur_name = Array.isArray(cur) ? cur[0] : cur;
			var subfield = Array.isArray(cur) && cur[1];
			if (props.hasOwnProperty(cur_name)) {
				if (typeof this[cur_name] != 'function' && this[cur_name] !== true) {
					var obj = {
						props_map: this[cur_name]
					};
					if (subfield) {
						obj.source = subfield;
					}
					this[cur_name] = spv.mmap(obj);
				}
				
			}
		}

		
	},
	xxxx_morph_props: [['hp_bound','--data--'], 'data_by_urlname', 'data_by_hp'],
	checkExpandableTree: function(state_name) {
		var i, cur, cur_config, has_changes = true, append_list = [];
		while (this.base_skeleton && has_changes) {
			has_changes = false;
			for (i = 0; i < this.base_skeleton.length; i++) {
				cur = this.base_skeleton[i];
				cur_config = this.base_tree_list[ cur.chunk_num ];
				if (cur.handled) {
					continue;
				}
				if (!cur.parent || cur.parent.handled) {
					if (!cur_config.needs_expand_state || cur_config.needs_expand_state == state_name){
						cur.handled = true;
						if (cur_config.sample_name) {
							cur.node = this.root_view.getSample( cur_config.sample_name );
						} else if (cur_config.part_name) {
							cur.node = this.requirePart( cur_config.part_name );
						} else {
							throw new Error('how to get node for this?!');
						}
						has_changes = true;
						append_list.push(cur);

						//sample_name
						//part_name
					}
				}
				
				//chunk_num
			}
			while (append_list.length) {
				cur = append_list.pop();
				if (cur.parent && cur.parent.node) {
					cur_config = this.base_tree_list[ cur.chunk_num ];
					var target_node = cur_config.selector ? $(cur.parent.node).find(cur_config.selector) : $(cur.parent.node);

					if (!cur_config.prepend) {
						target_node.append(cur.node);
					} else {
						target_node.prepend(cur.node);
					}

					if (cur_config.needs_expand_state && cur_config.parse_as_tplpart) {
						this.parseAppendedTPLPart(cur.node);
					}
				} else if (cur.parent){
					console.log('cant append');
				} else {
					this.c = cur.node;
				}
			}

		}
		if (!this.c && this.base_skeleton[0].node) {
			this.c = this.base_skeleton[0].node;
		}

		if (state_name && this.dclrs_expandable) {
			if (this.dclrs_expandable[state_name]) {
				if (!this._lbr.handled_expandable_dclrs) {
					this._lbr.handled_expandable_dclrs = {};
				}
				if (!this._lbr.handled_expandable_dclrs[state_name]) {
					this._lbr.handled_expandable_dclrs[state_name] = true;
					for (i = 0; i < this.dclrs_expandable[state_name].length; i++) {
						this.checkCollectionChange(this.dclrs_expandable[state_name][i]);
					}

					this.checkChildrenModelsRendering();
					this.requestAll();
				}
				
			}
		}
		

		//если есть прикреплённый родитель и пришло время прикреплять (если оно должно было прийти)
		//

		/*
		прикрепление родителя
		парсинг детей
		прикрепление детей

		прикрепление детей привязаных к якорю



		*/

	},
	collectBaseExtendStates: (function() {

		var getUnprefixed = spv.getDeprefixFunc('$ondemand-');
		return function() {
			var states_list = [], i, states_index = {};
			var dclrs_expandable = {};

			for ( var nesting_name in this.dclrs_fpckgs ) {

				if ( getUnprefixed(nesting_name) ) {
					var cur = this.dclrs_fpckgs[ nesting_name ];
					var added = false;
					for ( i = 0; i < cur.declarations.length; i++ ) {
						if (cur.declarations[i].needs_expand_state) {
							var state_name = cur.declarations[i].needs_expand_state;
							if (!states_index[state_name]) {
								states_index[state_name] = true;
								states_list.push( state_name );
							}

							if (!added) {
								if ( !dclrs_expandable[state_name] ) {
									dclrs_expandable[state_name] = [];
								}
								dclrs_expandable[state_name].push( getUnprefixed(nesting_name) );
							}
							 
						}
					}
				}
			}

			if (states_list.length) {
				this.base_tree_expand_states = states_list;
				this.dclrs_expandable = dclrs_expandable;
			}


			//debugger;
		};
	})()
});


var nes_as_state_cache = {};


var watchNestingAsState = function(md, nesting_name, state_name) {
	if (!nes_as_state_cache[state_name]) {
		nes_as_state_cache[state_name] = function(e) {
			this.updateState(state_name, e && e.value);
		};
	}

	md.on( hp.getFullChilChEvName(nesting_name), nes_as_state_cache[state_name]);
};




add({
	prsStCon: {
		toList: function(obj) {
			var result = [];
			for (var p in obj){
				if (obj.hasOwnProperty(p)){
					result.push(obj[p]);
				}
			}
			return result;
		},
		connect: {
			parent: function(md) {
				var list = md.conndst_parent;
				if (!list){
					return;
				}
				for (var i = 0; i < list.length; i++) {
					var cur = list[i];
					var count = cur.ancestors;
					var target = md;
					while (count){
						count--;
						target = target.getStrucParent();
					}
					if (!target){
						throw new Error();
					}
					md.wlch(target, cur.state_name, cur.full_name);
				}

			},
			nesting: function(md) {
				var list = md.conndst_nesting;
				if (!list){
					return;
				}
				if (!md.archivateChildrenStates) {
					throw new Error('cant calculate nesting based complex states for view (only for models)');
				}
				for (var i = 0; i < list.length; i++) {
					var cur = list[i];
					
					if (cur.state_name) {
						md.archivateChildrenStates(cur.nesting_name, cur.state_name, cur.zin_func, cur.full_name);
					} else {
						watchNestingAsState(md, cur.nesting_name, cur.full_name);
					}
					
					
					

				}
			},
			root: function(md) {
				var list = md.conndst_root;
				if (!list){
					return;
				}
				for (var i = 0; i < list.length; i++) {
					var cur = list[i];
					var target = md.getStrucRoot();
					if (!target){
						throw new Error();
					}
					md.wlch(target, cur.state_name, cur.full_name);
				}
				
			}
		}
	},
	collectStatesConnectionsProps: function() {
		/*
		'compx-some_state': [['^visible', '@some:complete:list', '#vk_id'], function(visible, complete){
	
		}]
		*/
		var states_of_parent = {};
		var states_of_nesting = {};
		var states_of_root = {};


		for (var i = 0; i < this.full_comlxs_list.length; i++) {
			var cur = this.full_comlxs_list[i];

			for (var jj = 0; jj < cur.depends_on.length; jj++) {
				var state_name = cur.depends_on[jj];
				var parsing_result = hp.getEncodedState(state_name);
				if (parsing_result) {
					if (parsing_result.rel_type == 'root') {
						if (!states_of_root[state_name]) {
							states_of_root[state_name] = parsing_result;
						}
					} else  if (parsing_result.rel_type == 'nesting') {
						if (!states_of_nesting[state_name]) {
							states_of_nesting[state_name] = parsing_result;
						}
					} else if (parsing_result.rel_type == 'parent') {
						if (!states_of_parent[state_name]) {
							states_of_parent[state_name] = parsing_result;
						}
					}
				}
				
			}
		}


		this.conndst_parent = this.prsStCon.toList(states_of_parent);
		this.conndst_nesting = this.prsStCon.toList(states_of_nesting);
		this.conndst_root = this.prsStCon.toList(states_of_root);

	},

	
//	full_comlxs_list: [],
	compx_check: {},
//	full_comlxs_index: {},

	collectCompxs: (function() {
		var getUnprefixed = spv.getDeprefixFunc( 'compx-' );
		var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

		var collectCompxs1part = function(compx_check) {
			for (var comlx_name in this){
				var name = getUnprefixed(comlx_name);
				if (name){
					
					var cur = this[comlx_name];
					if (cur instanceof Array){
						cur = {
							depends_on: cur[0],
							fn: cur[1],
							name: name
						};
					} else {
						this[comlx_name].name = name;
					}
					compx_check[name] = cur;
					this.full_comlxs_list.push(cur);
				}
			}
		};
		var collectCompxs2part = function(compx_check) {
			for (var comlx_name in this.complex_states){
				if (!compx_check[comlx_name]){
					
					var cur = this.complex_states[comlx_name];

					if (cur instanceof Array){
						cur = {
							depends_on: cur[0],
							fn: cur[1],
							name: comlx_name
						};
					} else {
						this.complex_states[comlx_name].name = comlx_name;
					}
					compx_check[comlx_name] = cur;
					
					this.full_comlxs_list.push(cur);
				}
			}
		};
		return function(props) {
			var need_recalc = false;
			if (this.hasOwnProperty('complex_states')){
				need_recalc = true;
			} else {
				need_recalc = hasPrefixedProps(props);
			}
			if (!need_recalc){
				return;
			}

			var compx_check = {};
			this.full_comlxs_list = [];
			this.full_comlxs_index = {};

			collectCompxs1part.call(this, compx_check);
			collectCompxs2part.call(this, compx_check);
			this.compx_check = compx_check;
			var i, jj, cur, state_name;
			for (i = 0; i < this.full_comlxs_list.length; i++) {
				cur = this.full_comlxs_list[i];
				for (jj = 0; jj < cur.depends_on.length; jj++) {
					state_name = cur.depends_on[jj];
					if (!this.full_comlxs_index[state_name]) {
						this.full_comlxs_index[state_name] = [];
					}
					this.full_comlxs_index[state_name].push(cur);
				}
			}
			this.collectStatesConnectionsProps();
		};
	})(),
	collectRegFires: (function() {
		var getUnprefixed = spv.getDeprefixFunc( 'regfr-', true );
		var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );


		return function(props) {			
			if (!hasPrefixedProps(props)){
				return;
			}
			var prop;

			this.reg_fires = {
				by_namespace: null,
				by_test: null,
				cache: null
			};
			for (prop in this){

				if (getUnprefixed(prop)){
					var cur = this[prop];
					if (cur.event_name){
						if (!this.reg_fires.by_namespace){
							this.reg_fires.by_namespace = {};
						}
						this.reg_fires.by_namespace[cur.event_name] = cur;
					} else if (cur.test){
						if (!this.reg_fires.by_test){
							this.reg_fires.by_test = [];
						}
						this.reg_fires.by_test.push(cur);
					}
				}
			}
		};
	})(),
	collectStatesBinders: (function(){
		var getUnprefixed = spv.getDeprefixFunc( 'state-' );
		var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

		return function(props) {
			if (!hasPrefixedProps(props)){
				return;
			}
			var prop;
			this._interfaces_to_states_index = {};

			var all_states_instrs = [];
			for (prop in this) {
				var state_name = getUnprefixed(prop);
				if (!state_name) {continue;}
				var cur = this[prop];
				all_states_instrs.push({
					state_name: state_name,
					interface_name: cur[0],
					fn: cur[1]
				});
			}
			this._interfaces_to_states_index = spv.makeIndexByField(all_states_instrs, 'interface_name', true);
		};
	})(),
	state: function(name){
		return this.states[name];
	}
});


var compressChangesList = function(changes_list, i, prop_name, value, counter) {
	if (this[prop_name] !== true){
		var num = (changes_list.length - 1) - counter * 2;
		changes_list[ num - 1 ] = prop_name;
		changes_list[ num ] = value;

		this[prop_name] = true;
		return true;
	}

};
var reversedIterateChList = function(changes_list, context, cb) {
	var counter = 0;
	for (var i = changes_list.length - 1; i >= 0; i-=2) {
		if (cb.call(context, changes_list, i, changes_list[i-1], changes_list[i], counter)){
			counter++;
		}
	}
	return counter;
};




var getSTCHfullname = spv.getPrefixingFunc('stch-');

add({
	compressStatesChanges: function(changes_list) {
		var result_changes = {};
		var counter = reversedIterateChList(changes_list, result_changes, compressChangesList);
		counter = counter * 2;
		while (changes_list.length != counter){
			changes_list.shift();
		}
		return changes_list;
	},
	proxyStch: function(value, old_value_trans, state_name) {
		var old_value = this.zdsv.stch_states[state_name];
		if (old_value != value) {
			this.zdsv.stch_states[state_name] = value;
			var method = (this[ getSTCHfullname( state_name ) ] || (this.state_change && this.state_change[state_name]));
			method.call(this, value, old_value, state_name);
		}
	},
	_handleStch: function(original_states, state_name, value, skip_handler, sync_tpl) {
		var stateChanger = !skip_handler && (this[ getSTCHfullname( state_name ) ] || (this.state_change && this.state_change[state_name]));
		if (stateChanger) {
			this.zdsv.abortFlowSteps('stch', state_name, true);
		} else {
			return;
		}
		var old_value = this.zdsv.stch_states[state_name];
		if (old_value != value) {
			var method;
			
			if (stateChanger){
				if (typeof stateChanger == 'function'){
					method = stateChanger;
				} else if (this.checkDepVP){
					if (this.checkDepVP(stateChanger)){
						method = stateChanger.fn;
					}
				}
			}

			if (method){
				if (!sync_tpl) {
					var flow_step = this.nextLocalTick(this.proxyStch, [value, old_value, state_name], true);
					flow_step.p_space = 'stch';
					flow_step.p_index_key = state_name;
					this.zdsv.createFlowStepsArray('stch', state_name, flow_step);
				} else {
					this.proxyStch(value, old_value, state_name);
				}
				
				
				//method.call(this, value, old_value);
			}
		}
	},
	_replaceState: function(original_states, state_name, value, stack) {
		if (state_name){
			var old_value = this.states[state_name];
			if (old_value != value){
				//value = value || false;
				//less calculations? (since false and "" and null and undefined now os equeal and do not triggering changes)

				if (!original_states.hasOwnProperty(state_name)) {
					original_states[state_name] = this.states[state_name];
				}
				this.states[state_name] = value;
				stack.push(state_name, value);
			}
		}
	}});

//var st_event_name_default = ;
//var st_event_name_vip = 'vip_state_change-';
//var st_event_name_light = 'lgh_sch-';





var PVStateChangeEvent = function(type, value, old_value, target) {
	this.type = type;
	this.value = value;
	this.old_value = old_value;
	this.target = target;
};


var st_event_opt = {force_async: true};

add({
	_triggerVipChanges: function(i, state_name, value, zdsv) {
		var vip_name = hp.getSTEVNameVIP( state_name);
		zdsv.abortFlowSteps('vip_stdch_ev', state_name);


		var vip_cb_cs = this.evcompanion.getMatchedCallbacks(vip_name).matched;
		if (vip_cb_cs.length) {
			var flow_steps = zdsv.createFlowStepsArray('vip_stdch_ev', state_name);
			var event_arg = new PVStateChangeEvent(state_name, value, zdsv.original_states[state_name], this);
			
			//вызов внутреннего для самого объекта события
			this.evcompanion.triggerCallbacks(vip_cb_cs, false, false, vip_name, event_arg, flow_steps);
			hp.markFlowSteps(flow_steps, 'vip_stdch_ev', state_name);
		}
		
	},
	triggerLegacySChEv: function(state_name, value, zdsv, default_cb_cs, default_name, flow_steps) {
		var event_arg = new PVStateChangeEvent(state_name, value, zdsv.original_states[state_name], this);
				//вызов стандартного события
		this.evcompanion.triggerCallbacks(default_cb_cs, false, st_event_opt, default_name, event_arg, flow_steps);
	},
	_triggerStChanges: function(i, state_name, value, zdsv) {

		zdsv.abortFlowSteps('stev', state_name);

		var default_name = hp.getSTEVNameDefault( state_name );
		var light_name = hp.getSTEVNameLight( state_name );

		var default_cb_cs = this.evcompanion.getMatchedCallbacks(default_name).matched;
		var light_cb_cs = this.evcompanion.getMatchedCallbacks(light_name).matched;
		
		if (light_cb_cs.length || default_cb_cs.length) {
			var flow_steps = zdsv.createFlowStepsArray('stev', state_name);

			if (light_cb_cs.length) {
				this.evcompanion.triggerCallbacks(light_cb_cs, false, false, light_name, value, flow_steps);
			}

			if (default_cb_cs.length) {
				this.triggerLegacySChEv(state_name, value, zdsv, default_cb_cs, default_name, flow_steps);
			}

			if (flow_steps) {
				hp.markFlowSteps(flow_steps, 'stev', state_name);
			}

		}

	

	},
	_setUndetailedState: function(i, state_name, value) {
		this._lbr.undetailed_states[state_name] = value;
	},
	updateManyStates: function(obj) {
		var changes_list = [];
		for (var state_name in obj) {
			if (obj.hasOwnProperty(state_name)){
				changes_list.push(state_name, obj[state_name]);
			}
		}
		this._updateProxy(changes_list);
	},
	utils: {
		isDepend: function(obj) {
			return obj && !!obj.count;
		}
	},
	updateState: function(state_name, value, opts){
		/*if (state_name.indexOf('-') != -1 && console.warn){
			console.warn('fix prop state_name: ' + state_name);
		}*/
		if (this.hasComplexStateFn(state_name)){
			throw new Error("you can't change complex state in this way");
		}
		return this._updateProxy([state_name, value], opts);
	},
	hndRDep: (function() {
		var cache = {};
		var getTargetName = function(state_name) {
			if (!cache[state_name]) {
				cache[state_name] = state_name.split( ':' )[ 1 ];
			}
			return cache[state_name];
		};
		return function(state, oldstate, state_name) {
			var target_name = getTargetName(state_name);
			if (oldstate) {
				oldstate.setStateDependence(target_name, this, false);
			}
			if (state) {
				state.setStateDependence(target_name, this, true);
			}
		};
	})(),
	setStateDependence: function(state_name, source_id, value) {
		if (typeof source_id == 'object') {
			source_id = source_id._provoda_id;
		}
		var old_value = this.state(state_name) || {index: {}, count: 0};
		old_value.index[source_id] = value ? true: false;

		var count = 0;

		for (var prop in old_value.index) {
			if (!old_value.index.hasOwnProperty(prop)) {
				continue;
			}
			if (old_value.index[prop]) {
				count++;
			}
		}



		this.updateState(state_name, {
			index: old_value.index,
			count: count
		});


	},
	hasComplexStateFn: function(state_name) {
		return this.compx_check[state_name];
	},

	_updateProxy: function(changes_list, opts) {
		if (this._lbr && this._lbr.undetailed_states){
			iterateChList(changes_list, this, this._setUndetailedState);
			return this;
		}

		//порождать события изменившихся состояний (в передлах одного стэка/вызова)
		//для пользователя пока пользователь не перестанет изменять новые состояния
		if (!this.zdsv){
			this.zdsv = new StatesLabour(!!this.full_comlxs_index, this._has_stchs);
		}
		var zdsv = this.zdsv;


		zdsv.states_changing_stack.push(changes_list, opts);

		if (zdsv.collecting_states_changing){
			return this;
		}

		

		zdsv.collecting_states_changing = true;
		//this.zdsv is important for this!!!
		//this.zdsv.collecting_states_changing - must be semi public;


		var total_ch = zdsv.total_ch;
		var original_states = zdsv.original_states;
		var all_i_cg = zdsv.all_i_cg;
		var all_ch_compxs = zdsv.all_ch_compxs;
		var changed_states = zdsv.changed_states;
		
		while (zdsv.states_changing_stack.length){

			
			

			//spv.cloneObj(original_states, this.states);

			var cur_changes_list = zdsv.states_changing_stack.shift();
			var cur_changes_opts = zdsv.states_changing_stack.shift();

			//получить изменения для состояний, которые изменил пользователь через публичный метод
			this.getChanges(original_states, cur_changes_list, cur_changes_opts, changed_states);
			//var changed_states = ... ↑

			cur_changes_list = cur_changes_opts = null;

			if (this.full_comlxs_index) {
				//проверить комплексные состояния
				var first_compxs_chs = this.getComplexChanges(original_states, changed_states);
				if (first_compxs_chs.length){
					push.apply(all_ch_compxs, first_compxs_chs);
				}

				var current_compx_chs = first_compxs_chs;
				//довести изменения комплексных состояний до самого конца
				while (current_compx_chs.length){
					var cascade_part = this.getComplexChanges(original_states, current_compx_chs);
					current_compx_chs = cascade_part;
					if (cascade_part.length){
						push.apply(all_ch_compxs, cascade_part);
					}
					cascade_part = null;

				}
				current_compx_chs = null;
			}

			

			//собираем все группы изменений
			if (changed_states.length){
				push.apply(all_i_cg, changed_states);
			}
			if (all_ch_compxs && all_ch_compxs.length){
				push.apply(all_i_cg, all_ch_compxs);
			}
			//устраняем измененное дважды и более
			this.compressStatesChanges(all_i_cg);


			
			iterateChList(all_i_cg, this, this._triggerVipChanges, zdsv);

			

			if (all_i_cg.length){
				push.apply(total_ch, all_i_cg);
			}


			hp.wipeObj(original_states);
			all_i_cg.length = changed_states.length = 0;
			if (all_ch_compxs) {
				all_ch_compxs.length = 0;
			}
			
			//объекты используются повторно, ради выиграша в производительности
			//которые заключается в исчезновении пауз на сборку мусора 
		}

		//устраняем измененное дважды и более
		this.compressStatesChanges(total_ch);
		iterateChList(total_ch, this, this._triggerStChanges, zdsv);


		//hp.wipeObj(original_states);
		//all_i_cg.length = all_ch_compxs.length = changed_states.length = 0;

		if (this.sendStatesToMPX && total_ch.length){
			this.sendStatesToMPX(total_ch);
			total_ch.length = 0;
		} else {
			total_ch.length = 0;
		}


		zdsv.collecting_states_changing = false;
		//this.zdsv = null;
		return this;
	},

	getComplexChanges: function(original_states, changes_list) {
		return this.getChanges(original_states, this.checkComplexStates(changes_list));
	},
	getChanges: function(original_states, changes_list, opts, result_arr) {
		var changed_states = result_arr || [];
		var i;
		for (i = 0; i < changes_list.length; i+=2) {
			this._replaceState(original_states, changes_list[i], changes_list[i+1], changed_states);
		}
		if (this.updateTemplatesStates){
			this.updateTemplatesStates(changes_list, opts && opts.sync_tpl);
		}
		for (i = 0; i < changes_list.length; i+=2) {
			this._handleStch(original_states, changes_list[i], changes_list[i+1], opts && opts.skip_handler, opts && opts.sync_tpl);
		}
		return changed_states;
	},
	checkComplexStates: function(changes_list) {

		return this.getTargetComplexStates(changes_list);
	},
	getTargetComplexStates: function(changes_list) {
		var matched_compxs = [];
		var result_array = [];

		var i, cur;

		for ( i = 0; i < changes_list.length; i+=2) {
			cur = this.full_comlxs_index[changes_list[i]];
			if (!cur){
				continue;
			}
			for (var jj = 0; jj < cur.length; jj++) {
				if (matched_compxs.indexOf(cur[jj]) == -1){
					matched_compxs.push(cur[jj]);
				}
			}
		}

		for ( i = 0; i < matched_compxs.length; i++) {
			cur = matched_compxs[i];
			result_array.push(cur.name, this.compoundComplexState(cur));
		}

		return result_array;
	},
	compoundComplexState: function(temp_comx) {
		var values = new Array(temp_comx.depends_on.length);
		for (var i = 0; i < temp_comx.depends_on.length; i++) {
			values[i] = this.state(temp_comx.depends_on[i]);
		}
		return temp_comx.fn.apply(this, values);
	}
});
});
return StatesEmitter;
};
});