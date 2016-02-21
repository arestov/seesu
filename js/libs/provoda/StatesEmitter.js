define(function(require) {
'use strict';

var spv = require('spv');
var hp = require('./helpers');
var updateProxy = require('./updateProxy');
var StatesLabour = require('./StatesLabour');
var prsStCon = require('./prsStCon');
var Eventor = require('./Eventor');

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

var collectSubpages = buildSubpageCollector();
var checkSubpager = buildSubpagerChecker();

var xxxx_morph_props = [['hp_bound','--data--'], 'data_by_urlname', 'data_by_hp', 'head_by_urlname', 'netdata_as_states'];

var onPropsExtend = function (props) {
	if (this.collectStateChangeHandlers){
		this.collectStateChangeHandlers(props);
	}
	var collches_modified;
	if (this.collectCollectionChangeDeclarations){
		collches_modified = this.collectCollectionChangeDeclarations(props);
	}
	if (this.collectSelectorsOfCollchs) {
		this.collectSelectorsOfCollchs(props);
	}
	this.collectStatesBinders(props);
	this.collectCompxs(props);
	collectSubpages(this, props);
	checkSubpager(this, props);
	this.collectRegFires(props);

	if (this.hasOwnProperty('st_nest_matches') || this.hasOwnProperty('compx_nest_matches')) {
		this.nest_match = (this.st_nest_matches || []).concat(this.compx_nest_matches || []);
	}

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


	for (var i = 0; i < xxxx_morph_props.length; i++) {
		// если есть декларации - парсим, делаем функции
		// на вход функции - одна структура, на выход - другая
		var cur = xxxx_morph_props[i];
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
};

// Eventor.extendTo(StatesEmitter,
function props(add) {


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
	// init: function(){
	// 	this._super();


	// 	return this;
	// },
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
	onExtend: onPropsExtend,
	collectBaseExtendStates: (function() {

		var getUnprefixed = spv.getDeprefixFunc('$ondemand-');
		return function() {
			var states_list = [], states_index = {};
			var dclrs_expandable = {};

			for ( var nesting_name in this.dclrs_fpckgs ) {

				if ( getUnprefixed(nesting_name) ) {
					var cur = this.dclrs_fpckgs[ nesting_name ];
					var added = false;

					if (cur.needs_expand_state) {
						var state_name = cur.needs_expand_state;
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
	collectStatesConnectionsProps: function() {
		/*
		'compx-some_state': [['^visible', '@some:complete:list', '#vk_id'], function(visible, complete){

		}]
		*/
		/*
				nest_match: [
			['songs-list', 'mf_cor', 'sorted_completcs']
		]
		*/

		this.compx_nest_matches = [];

		var states_of_parent = {};
		var states_of_nesting = {};
		var states_of_root = {};

		for (var i = 0; i < this.full_comlxs_list.length; i++) {
			var cur = this.full_comlxs_list[i];

			for (var jj = 0; jj < cur.depends_on.length; jj++) {
				var state_name = cur.depends_on[jj];
				var parsing_result = hp.getEncodedState(state_name);
				if (!parsing_result) {
					continue;
				}
				switch (parsing_result.rel_type) {
					case 'root': {
						if (!states_of_root[state_name]) {
							states_of_root[state_name] = parsing_result;
						}
					}
					break;
					case 'nesting': {
						if (!states_of_nesting[state_name]) {
							states_of_nesting[state_name] = parsing_result;
							this.compx_nest_matches.push( parsing_result.nwatch );
						}
					}
					break;
					case 'parent': {
						if (!states_of_parent[state_name]) {
							states_of_parent[state_name] = parsing_result;
						}
					}
					break;
				}
			}
		}

		this.conndst_parent = prsStCon.toList(states_of_parent);
		this.conndst_nesting = prsStCon.toList(states_of_nesting);
		this.conndst_root = prsStCon.toList(states_of_root);

	},
//	full_comlxs_list: [],
	compx_check: {},
//	full_comlxs_index: {},

	collectCompxs: (function() {
		var getUnprefixed = spv.getDeprefixFunc( 'compx-' );
		var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

		var identical = function(state) {
			return state;
		};

		var fromArray = function(state_name, cur) {
			return {
				depends_on: cur[0] || [],
				fn: cur[1],
				name: state_name,
				watch_list: null
			};
		};

		var declr = function(comlx_name, cur) {
			var item = cur instanceof Array ? fromArray(comlx_name, cur) : cur;
			item.name = comlx_name;

			if (!item.depends_on.length && typeof item.fn !== 'function') {
				var value = item.fn;
				item.fn = function() {
					return value;
				};
			}

			if (!item.fn) {
				item.fn = identical;
			}
			item.watch_list = new Array(item.depends_on.length || 0);
			for (var i = 0; i < item.depends_on.length; i++) {
				item.watch_list[i] = hp.getShortStateName(item.depends_on[i]);
			}
			return item;
		};

		var collectCompxs1part = function(compx_check) {
			for (var prefixed_name in this){
				var comlx_name = getUnprefixed(prefixed_name);
				if (comlx_name){
					var cur = this[prefixed_name];
					if (!cur) {continue;}

					var item = declr(comlx_name, cur);
					compx_check[comlx_name] = item;
					this.full_comlxs_list.push(item);
				}
			}
		};
		var collectCompxs2part = function(compx_check) {
			for (var comlx_name in this.complex_states){
				if (!compx_check[comlx_name]){
					var cur = this.complex_states[comlx_name];
					if (!cur) {continue;}

					var item = declr(comlx_name, cur);
					compx_check[comlx_name] = item;
					this.full_comlxs_list.push(item);
				}
			}
		};
		return function(props) {

			var part1 = hasPrefixedProps(props);
			var part2 = this.hasOwnProperty('complex_states');
			var need_recalc = part1 || part2;

			if (!need_recalc){
				return;
			}

			var compx_check = {};
			this.full_comlxs_list = [];
			this.full_comlxs_index = {};

			for (var prop in props.complex_states) {
				if (props['compx-' + prop]) {
					throw new Error('can`t be (in one layer) compx in both `complex_states` and "compx-"' + prop);
				}
			}

			collectCompxs1part.call(this, compx_check);
			collectCompxs2part.call(this, compx_check);

			this.compx_check = compx_check;
			var i, jj, cur, state_name;
			for (i = 0; i < this.full_comlxs_list.length; i++) {
				cur = this.full_comlxs_list[i];
				for (jj = 0; jj < cur.watch_list.length; jj++) {
					state_name = cur.watch_list[jj];
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

			var build_index = this._build_cache_interfaces;
			this._build_cache_interfaces = {};

			this._interfaces_to_states_index = {};

			var all_states_instrs = [];
			for (prop in this) {
				var state_name = getUnprefixed(prop);
				if (!state_name) {continue;}
				var item;
				if (props.hasOwnProperty(prop)) {
					var cur = this[prop];
					item = cur && {
						state_name: state_name,
						interface_name: cur[0],
						fn: cur[1]
					};

				} else {
					item = build_index[state_name];
				}
				this._build_cache_interfaces[state_name] = item;
				all_states_instrs.push(item);

			}
			this._interfaces_to_states_index = spv.makeIndexByField(all_states_instrs, 'interface_name', true);
		};
	})(),
	state: (function(){
		var getter = hp.stateGetter;

		return function(state_path){
			var getField = getter(state_path);
			return getField(this.states);
		};
	})()
});

add({


	updateManyStates: function(obj) {
		var changes_list = [];
		for (var state_name in obj) {
			if (obj.hasOwnProperty(state_name)){
				if (this.hasComplexStateFn(state_name)) {
					throw new Error("you can't change complex state " + state_name);
				}
				changes_list.push(true, state_name, obj[state_name]);
			}
		}
		this._updateProxy(changes_list);
	},

	updateState: function(state_name, value, opts){
		/*if (state_name.indexOf('-') != -1 && console.warn){
			console.warn('fix prop state_name: ' + state_name);
		}*/
		if (this.hasComplexStateFn(state_name)){
			throw new Error("you can't change complex state in this way");
		}
		return this._updateProxy([true, state_name, value], opts);
	},
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
		updateProxy(this, changes_list, opts);
	}
});
}

var StatesEmitter = spv.inh(Eventor, {
	naming: function(construct) {
		return function StatesEmitter() {
			construct(this);
		};
	},
	building: function(parentBuilder) {
		return function StatesEmitterBuilder(obj) {
			parentBuilder(obj);

			obj.conx_optsi = null;
			obj.conx_opts = null;
			obj.zdsv = null;
			obj.current_motivator = obj.current_motivator || null;

			obj._state_updaters = null;
			obj._used_interfaces = null;
			obj._unuse_interface_instr = null;

			obj.states = {};
		};
	},
	onExtend: function(md, props, original) {
		onPropsExtend.call(md, props, original);
	},
	props: props
});

var subPageHeaded = function(Constr, head) {
	return {
		constr: Constr,
		head: head,
		getHead: head && spv.mmap({
			props_map: head
		})
	};
};

var getSubpageItem = function(self, cur) {
	var item;
	if (Array.isArray(cur)) {
		if (!cur[1] && !cur[2]) {
			/* EXAMPLE
			'sub_page-similar': [
				SimilarTags
			]
			*/
			throw new Error('keep code clean: use short `sub_page` declaration if you do not have special title');
			// instance = cur[0];
		} else {
			/* EXAMPLE
			'sub_page-similar': [
				SimilarTags,
				[
					['locales.Tags', 'locales.Similar-to', 'tag_name'],
					function (tags, similar, name) {
						return similar + ' ' + name + ' ' + tags.toLowerCase();
					}
				]
			]
			*/

			var instance = cur[1] ? spv.inh(cur[0], {}, {
				'compx-nav_title': cur[1]
			}) : cur[0];
			item = subPageHeaded(instance, cur[2]);
		}
	} else if (typeof cur == 'object') {
		// semi compatibility (migration) mode

		/* EXAMPLE
		'sub_page-similar': {
			constr: SimilarTags,
			title: [[...]]
		}
		*/
		if (!cur.title || typeof cur.title != 'object') {
			// title should be. in array or object presentation
			throw new Error('keep code clean: use short `sub_page` declaration if you do not have special title');
		}

		item = subPageHeaded(spv.inh(cur.constr, {}, {
			'compx-nav_title': cur.title
		}), cur.head);
	} else {
		/* EXAMPLE
		'sub_page-similar': SimilarTags
		*/
		item = subPageHeaded(cur);
	}

	if (!item.constr.prototype.compx_check['nav_title']) {
		throw new Error('sub_page shoud have `title`');
	}

	return item;
};


function addSubpage(self, name, cur) {
	self._sub_pages[name] = getSubpageItem(self, cur);
}

function buildSubpageCollector() {
	var getUnprefixed = spv.getDeprefixFunc( 'sub_page-' );
	var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

	var add = addSubpage;

	return function collectSubpages(self, props) {
		if (!hasPrefixedProps(props) && !props.sub_page) {
			return;
		}

		for (var prop in props.sub_page) {
			if (props['sub_page-' + prop]) {
				throw new Error('can`t be (in one layer) sub_page in both `sub_page` and "sub_page-"' + prop);
			}
		}

		self._sub_pages = {};

		for (var prop_name in self) {
			var name = getUnprefixed(prop_name);
			if (!name) {
				continue;
			}
			add(self, name, props[prop_name]);

		}

		for (var prop_name in self.sub_page) {
			if (self._sub_pages[prop_name]) {
				continue;
			}
			add(self, prop_name, self.sub_page[prop_name]);
		}
	};
}

function buildSubpagerChecker() {
	return function(self, props) {
		var sub_pager = props.sub_pager;

		if (!sub_pager) {
			return;
		}

		if (sub_pager.item && sub_pager.by_type) {
			throw new Error('can`t be both `item` and `by_type`');
		}

		self._sub_pager = {
			key: null,
			item: null,
			by_type: null,
			type: null
		};

		self._sub_pager.key = sub_pager.key;

		if (sub_pager.item) {
			self._sub_pager.item = getSubpageItem(self, sub_pager.item);
		} else {
			self._sub_pager.type = sub_pager.type;
			self._sub_pager.by_type = {};
			for (var type in sub_pager.by_type) {
				self._sub_pager.by_type[type] = getSubpageItem(self, sub_pager.by_type[type]);
			}
		}

	};
}

StatesEmitter.addSubpage = addSubpage;

return StatesEmitter;
});
