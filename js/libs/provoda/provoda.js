define('pv', ['spv', './StatementsAngularParser.min', './PvTemplate', './sync_sender', './MDProxy', './helpers', './views_proxies', './SyncReceiver', './Eventor', './StatesEmitter', './CallbacksFlow', './Model', './View', './updateProxy'],
function(spv, angbo, PvTemplate, sync_sender, MDProxy, hp, views_proxies, SyncReceiver, getEventor, getStatesEmitter, CallbacksFlow, getModel, getView, updateProxy){
"use strict";

var provoda, pv;
var pvUpdate = updateProxy.update;
var DeathMarker = function() {
	//helper to find memory leaks; if there is memory leaking DeathMarker will be available in memory heap snapshot;
};


var big_index = {};
var main_calls_flow = new CallbacksFlow(window);

/*
var hasPrefixedProps = function(props, prefix) {
	for (var prop_name in props) {
		if (props.hasOwnProperty( prop_name ) && spv.startsWith( prop_name, prefix )){
			return true;
		}
	}
	return false;
};
*/

var Eventor = getEventor(main_calls_flow);
var StatesEmitter = getStatesEmitter(Eventor);
var Model = getModel(StatesEmitter, big_index, views_proxies, sync_sender);

pv = provoda = {
	CallbacksFlow: CallbacksFlow,
	hp: hp,
	$v: hp.$v,
	getRDep: hp.getRDep,
	utils: {
		isDepend: function(obj) {
			return obj && !!obj.count;
		}
	},
	initWebApp: function(root_md, RootViewConstr) {

		var proxies_space = Date.now();
		var views_proxies = provoda.views_proxies;
		views_proxies.addSpaceById(proxies_space, root_md);
		var mpx = views_proxies.getMPX(proxies_space, root_md);

		(function() {
			var view = new RootViewConstr();
			mpx.addView(view, 'root');
			view.init({
				mpx: mpx,
				proxies_space: proxies_space
			}, {d: window.document});
			view.requestAll();
			view = null;
		})();
	},
	getModelById: function(id) {
		return big_index[id];
	},
	prototypes: {},
	setTplFilterGetFn: function(fn) {
		angbo.getFilterFn = fn;
	},
	MDProxy: MDProxy,
	sync_s: sync_sender,
	SyncR: SyncReceiver,
	Eventor: Eventor,
	StatesEmitter: StatesEmitter,
	Model: Model,
	HModel: getHModel(),
	View: getView(StatesEmitter, main_calls_flow, views_proxies),
	views_proxies: views_proxies,
	addPrototype: function(name, obj){
		if (!this.prototypes[name]){
			this.prototypes[name] = obj;
		} else{
			throw new Error('Already has such prototype');
		}
	},
	extendFromTo: function(name, base, fn){
		if (!this.prototypes[name]){
			throw new Error('there is no prototype ' + name + ' in my store');
		}
		base.extendTo(fn, this.prototypes[name]);
		return fn;
	},
	getOCF: function(propcheck, callback) {
		//init once
		return function(){
			if (this[propcheck]){
				return this;
			} else {
				this[propcheck] = true;
				callback.apply(this, arguments);
				return this;
			}
		};
	},

	updateNesting: function(md, nesting_name, nesting_value, opts, spec_data) {
		md.updateNesting(nesting_name, nesting_value, opts, spec_data);
	},
	mpx: {
		update: function(mpx, state_name, state_value, opts) {
			mpx.updateState(state_name, state_value, opts);
		}
	},
	update: updateProxy.update,
	state: hp.state,
	behavior: function(declr, declr_extend_from, named) {
		var behaviorFrom = declr_extend_from || pv.Model;
		if (typeof named == 'object' || !declr.init) {
			return spv.inh(behaviorFrom, {
				naming: named.naming,
				init: named.init,
				props: declr
			});
		}
		var func = named || function() {};
		behaviorFrom.extendTo(func, declr);
		return func;
	},
	dom: {
		template: PvTemplate
	},
	create: function(Constr, states, params, map_parent, app) {
		var BehaviorContr = Constr || pv.Model;
		var opts = (app || map_parent) && {
			app: app || map_parent.app,
			map_parent: map_parent
		};

		var model = new BehaviorContr(opts, null, null, null, states);
		if (model.init) {
			model.init(opts, null, null, null, states);
		}


		if (params) {
			if (params.interfaces) {
				spv.forEachKey(params.interfaces, function(intrface, interface_name, model) {
					model.useInterface(interface_name, intrface);
				}, model);
			}

			if (params.nestings) {
				spv.forEachKey(params.nestings, function(nesting, nesting_name, model) {
					model.updateNesting(nesting_name, nesting);
				}, model);
			}

		}

		if (model.init_states) {
			model.initStates();
		}

		return model;
	}
};
provoda.Controller = provoda.View;

function getHModel() {
var HModel = spv.inh(Model, {
	strict: true,
	naming: function(fn) {
		return function HModel(opts, data, params, more, states) {
			fn(this, opts, data, params, more, states);
		};
	},
	preinit: function(self, opts) {

		//opts = opts || {};
		if (!self.app){
			self.app = null;
		}

		self.sub_pages = null;
		if (!self.map_parent){
			self.map_parent = null;
		}

		self.pmd_switch = null;

		if (!self.skip_map_init){
			if (self.sub_pa || self.subPager){
				self.sub_pages = {};
			}

			if (!opts || !opts.map_parent) {
				if (!self.zero_map_level){
					throw new Error('who is your map parent model?');
				}
			}
		}

		var map_parent = self.map_parent || opts.map_parent;

		self.map_level_num = null;

		if (self.zero_map_level) {
			self.map_level_num = -1;
		} else {
			if (map_parent) {
				self.map_level_num = map_parent.map_level_num + 1;
			}
		}

		// self._super.apply(this, arguments);
	},
}, {
	network_data_as_states: true,
	_hndOnPMDSwitch: function(e) {
		this.checkPMDSwiched(e.value);
	},
	setPmdSwitcher: function(pmd) {
		this.pmd_switch = pmd;

		pmd.on('state_change-vswitched', this._hndOnPMDSwitch, this.getContextOptsI());
	},
	'stch-vswitched': function(target, state, old_state) {
		if (state) {
			var md = pv.getModelById(state);
			pvUpdate(md, 'pmd_vswitched', true);
		}
		if (old_state) {
			var old_md = pv.getModelById(old_state);
			pvUpdate(old_md, 'pmd_vswitched', false);
		}
	},
	switchPmd: function(toggle) {
		var new_state;
		if (typeof toggle == 'boolean')	{
			new_state = toggle;
		} else {
			new_state = !this.state('pmd_vswitched');
		}
		var pmd_switch = this.pmd_switch || this.pmd_switch_is_parent && this.map_parent;

		if (new_state){
			if (!this.state('pmd_vswitched')){
				pvUpdate(pmd_switch, 'vswitched', this._provoda_id);
			}
		} else {
			if (this.state('pmd_vswitched')){
				pvUpdate(pmd_switch, 'vswitched', false);
			}
		}
	},
	checkPMDSwiched: function(value) {
		pvUpdate(this, 'pmd_vswitched', value == this._provoda_id);
	}
});

return HModel;
}

provoda.BaseRootView = spv.inh(provoda.View, {
	preinit: function(target, opts, vopts) {
		target.calls_flow = new provoda.CallbacksFlow(spv.getDefaultView(vopts.d), !vopts.usual_flow, 250);
	}
}, {
	_getCallsFlow: function() {
		return this.calls_flow;
	},
	remove: function() {
		this.calls_flow = null;
	}
});


if ( typeof window === "object" && typeof window.document === "object" ) {
	window.provoda = provoda;
}
return provoda;
});
