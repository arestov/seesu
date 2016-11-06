define(function(require) {
'use strict';

var spv = require('spv');
var hp = require('./helpers');
var updateProxy = require('./updateProxy');
var StatesLabour = require('./StatesLabour');
var Eventor = require('./Eventor');
var checkApis = require('./StatesEmitter/checkApis');
var addSubpage = require('./StatesEmitter/addSubpage');
var checkSubpager = require('./StatesEmitter/checkSubpager');
var collectSubpages = require('./StatesEmitter/collectSubpages');
var collectCompxs = require('./StatesEmitter/collectCompxs');
var checkChi = require('./StatesEmitter/checkChi');
var checkNestRqC = require('./StatesEmitter/checkNestRqC');
var checkNestSel = require('./StatesEmitter/checkNestSel');
var useInterface = require('./StatesEmitter/useInterface');

var getConnector = spv.memorize(function(state_name) {
	return function updateStateBinded(e) {
		this.updateState(state_name, e.value);
	};
});

var getLightConnector = spv.memorize(function(state_name) {
	return function updateStateBindedLightly(value) {
		this.updateState(state_name, value);
	};
});
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

var xxxx_morph_props = [['hp_bound','--data--'], 'data_by_urlname', 'data_by_hp', 'head_by_urlname', 'netdata_as_states'];

var onPropsExtend = function (self, props) {
	checkApis(self, props);

	if (self.changeDataMorphDeclarations) {
		self.changeDataMorphDeclarations(props);
	}

	if (self.collectStateChangeHandlers){
		self.collectStateChangeHandlers(props);
	}
	var collches_modified;
	if (self.collectCollectionChangeDeclarations){
		collches_modified = self.collectCollectionChangeDeclarations(props);
	}
	if (self.collectSelectorsOfCollchs) {
		self.collectSelectorsOfCollchs(props);
	}
	collectCompxs(self, props);
	collectSubpages(self, props);
	checkSubpager(self, props);
	checkChi(self, props);
	checkNestRqC(self, props);
	checkNestSel(self, props);

	self.collectRegFires(self, props);

	if (self.hasOwnProperty('st_nest_matches') || self.hasOwnProperty('compx_nest_matches')) {
		self.nest_match = (self.st_nest_matches || []).concat(self.compx_nest_matches || []);
	}

	var base_tree_mofified = props.hasOwnProperty('base_tree');
	if (base_tree_mofified) {
		self.base_tree_list = getBaseTreeCheckList(props.base_tree);
	}
	if (collches_modified || base_tree_mofified) {
		self.collectBaseExtendStates();
	}

	if (self.collectNestingsDeclarations) {
		self.collectNestingsDeclarations(props);
	}

	if (self.changeChildrenViewsDeclarations) {
		self.changeChildrenViewsDeclarations(props);
	}


	for (var i = 0; i < xxxx_morph_props.length; i++) {
		// если есть декларации - парсим, делаем функции
		// на вход функции - одна структура, на выход - другая
		var cur = xxxx_morph_props[i];
		var cur_name = Array.isArray(cur) ? cur[0] : cur;
		var subfield = Array.isArray(cur) && cur[1];
		if (props.hasOwnProperty(cur_name)) {
			if (typeof self[cur_name] != 'function' && self[cur_name] !== true) {
				var obj = {
					props_map: self[cur_name]
				};
				if (subfield) {
					obj.source = subfield;
				}
				self[cur_name] = spv.mmap(obj);
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

add({
	onDie: function(cb) {
		this.on('die', cb);
	},
	// init: function(){
	// 	this._super();


	// 	return this;
	// },
	useInterface: function(interface_name, obj) {
		useInterface(this, interface_name, obj);
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
	onExtend: function(props, original) {
		onPropsExtend(this, props, original);
	},
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

add({
//	full_comlxs_list: [],
	compx_check: {},
//	full_comlxs_index: {},

	collectRegFires: (function() {
		var getUnprefixed = spv.getDeprefixFunc( 'regfr-', true );
		var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );


		return function(self, props) {
			if (!hasPrefixedProps(props)){
				return;
			}
			var prop;

			self.reg_fires = {
				by_namespace: null,
				by_test: null,
				cache: null
			};
			for (prop in self){

				if (!getUnprefixed(prop)){
					continue;
				}

				var cur = self[prop];
				if (cur.event_name){
					if (!self.reg_fires.by_namespace){
						self.reg_fires.by_namespace = {};
					}
					self.reg_fires.by_namespace[cur.event_name] = cur;
				} else if (cur.test){
					if (!self.reg_fires.by_test){
						self.reg_fires.by_test = [];
					}
					self.reg_fires.by_test.push(cur);
				}
			}
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
			obj._interfaces_using = null;

			obj.states = {};
		};
	},
	onExtend: onPropsExtend,
	props: props
});

StatesEmitter.addSubpage = addSubpage;

return StatesEmitter;
});
