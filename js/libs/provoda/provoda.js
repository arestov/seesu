define('pv', ['spv', './StatementsAngularParser.min', './PvTemplate', './sync_sender', './MDProxy', './helpers', './views_proxies', './SyncReceiver', './Eventor', './StatesEmitter', './CallbacksFlow', './Model', './View', './updateProxy'],
function(spv, angbo, PvTemplate, sync_sender, MDProxy, hp, views_proxies, SyncReceiver, getEventor, getStatesEmitter, CallbacksFlow, getModel, getView, updateProxy){
"use strict";

var provoda, pv;
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

pv = provoda = {
	CallbacksFlow: CallbacksFlow,
	hp: hp,
	$v: hp.$v,
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
	Model: getModel(StatesEmitter, big_index, views_proxies, sync_sender),
	HModel: function() {},
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
		var func = named || function() {};
		behaviorFrom.extendTo(func, declr);
		return func;
	},
	dom: {
		template: PvTemplate
	},
	create: function(Constr, states, params, map_parent, app) {
		var BehaviorContr = Constr || pv.Model;
		var model = new BehaviorContr();
		model.init((app || map_parent) && {
			app: app || map_parent.app,
			map_parent: map_parent
		}, null, null, null, states);

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


		model.initStates();
		return model;
	}
};
provoda.Controller = provoda.View;

provoda.Model.extendTo(provoda.HModel, {
	init: function(opts) {
		
		//opts = opts || {};
		if (!this.app){
			this.app = null;
		}

		this.sub_pages = null;
		if (!this.map_parent){
			this.map_parent = null;
		}
		
		this.pmd_switch = null;

		if (!this.skip_map_init){
			if (this.sub_pa || this.subPager){
				this.sub_pages = {};
			}

			if (!opts || !opts.map_parent) {
				if (!this.zero_map_level){
					throw new Error('who is your map parent model?');
				}
			}
		}

		var map_parent = this.map_parent || opts.map_parent;

		this.map_level_num = null;

		if (this.zero_map_level) {
			this.map_level_num = -1;
		} else {
			if (map_parent) {
				this.map_level_num = map_parent.map_level_num + 1;
			}
		}

		this._super.apply(this, arguments);
	},
	
	_hndOnPMDSwitch: function(e) {
		this.checkPMDSwiched(e.value);
	},
	setPmdSwitcher: function(pmd) {
		this.pmd_switch = pmd;

		pmd.on('state_change-vswitched', this._hndOnPMDSwitch, this.getContextOptsI());
	},
	switchPmd: function(toggle) {
		var new_state;
		if (typeof toggle == 'boolean')	{
			new_state = toggle;
		} else {
			new_state = !this.state('pmd_vswitched');
		}
		if (new_state){
			if (!this.state('pmd_vswitched')){
				pv.update(this.pmd_switch, 'vswitched', this._provoda_id);
			}
		} else {
			if (this.state('pmd_vswitched')){
				pv.update(this.pmd_switch, 'vswitched', false);
			}
		}
	},
	checkPMDSwiched: function(value) {
		pv.update(this, 'pmd_vswitched', value == this._provoda_id);
	}
});



provoda.BaseRootView = function BaseRootView () {};
provoda.View.extendTo(provoda.BaseRootView, {
	_getCallsFlow: function() {
		return this.calls_flow;
	},
	init: function(opts, vopts) {
		this.calls_flow = new provoda.CallbacksFlow(spv.getDefaultView(vopts.d), !vopts.usual_flow, 250);
		return this._super.apply(this, arguments);
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