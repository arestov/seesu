define('pv', ['spv', './StatementsAngularParser.min', './PvTemplate', './sync_sender', './MDProxy', './helpers', './views_proxies', './SyncReceiver', './Eventor', './StatesEmitter', './CallbacksFlow', './Model', './View'],
function(spv, angbo, PvTemplate, sync_sender, MDProxy, hp, views_proxies, SyncReceiver, getEventor, getStatesEmitter, CallbacksFlow, getModel, getView){
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
	update: function(md, state_name, state_value, opts) {
		md.updateState(state_name, state_value, opts);
	},
	behavior: function(declr, declr_extend_from, named) {
		var behaviorFrom = declr_extend_from || pv.Model;
		var func = named || function() {};
		behaviorFrom.extendTo(func, declr);
		return func;
	},
	dom: {
		template: PvTemplate
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
		this.init_states = null;
		if (!this.map_parent){
			this.map_parent = null;
		}
		
		this.pmd_switch = null;
		

		if (!this.skip_map_init){
			if (this.sub_pa || this.subPager){
				this.sub_pages = {};
			}

			if (!this.init_states){
				this.init_states = {};
			}
			if (!opts || !opts.map_parent) {
				if (!this.zero_map_level){
					throw new Error('who is your map parent model?');
				}
			}
		}
		this._super.apply(this, arguments);
	},
	mapStates: function(states_map, donor, acceptor) {
		if (acceptor && typeof acceptor == 'boolean'){
			acceptor = this.init_states;
		}
		return spv.mapProps(states_map, donor, acceptor);
	},
	initStates: function(more_states) {
		if (more_states) {
			spv.cloneObj(this.init_states, more_states);
		}
		this.updateManyStates(this.init_states);
		this.init_states = null;
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