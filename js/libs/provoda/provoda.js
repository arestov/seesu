define(function(require) {
'use strict';

var spv = require('spv');
var angbo = require('angbo');
var sync_sender = require('./sync_sender');
var MDProxy = require('./MDProxy');
var hp = require('./helpers');
var views_proxies = require('./views_proxies');
var SyncReceiver = require('./SyncReceiver');
var Eventor = require('./Eventor');
var StatesEmitter = require('./StatesEmitter');
var CallbacksFlow = require('./CallbacksFlow');
var Model = require('./Model');
var updateProxy = require('./updateProxy');
var initDeclaredNestings = require('./initDeclaredNestings');
var markStrucure = require('./structure/mark');

var provoda, pv;
var pvUpdate = updateProxy.update;
var DeathMarker = function() {
	//helper to find memory leaks; if there is memory leaking DeathMarker will be available in memory heap snapshot;
};

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
		throw new Error('broken');

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
			view.requestView();
			view = null;
		})();
	},
	getModelById: function(related_md, id) {
		return related_md._highway.models[id];
	},
	setTplFilterGetFn: function(fn) {
		angbo.getFilterFn = fn;
	},
	MDProxy: MDProxy,
	SyncSender: sync_sender,
	SyncR: SyncReceiver,
	Eventor: Eventor.PublicEventor,
	StatesEmitter: StatesEmitter,
	Model: Model,
	HModel: getHModel(),
	views_proxies: views_proxies,
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
	getParsedPath: initDeclaredNestings.getParsedPath,
	getSubpages: initDeclaredNestings.getSubpages,
	pathExecutor: initDeclaredNestings.pathExecutor,
	addSubpage: StatesEmitter.addSubpage,
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
	behavior: behavior,
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

		return model;
	},
	markStrucure: markStrucure
};

function behavior(declr, declr_extend_from, named) {
  var behaviorFrom = declr_extend_from || pv.Model;
  if (typeof named == 'object' || !declr.init) {
    return spv.inh(behaviorFrom, {
      naming: named && named.naming,
      init: named && named.init,
      props: declr
    });
  }
  var func = named || function() {};
  behaviorFrom.extendTo(func, declr);
  return func;
}

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

		if (!self.map_parent){
			self.map_parent = null;
		}

		if (!self.skip_map_init){

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
	'stch-vswitched': function(target, state, old_state) {
		if (state) {
			var md = pv.getModelById(target, state);
			pvUpdate(md, 'pmd_vswitched', true);
		}
		if (old_state) {
			var old_md = pv.getModelById(target, old_state);
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
		var pmd_switch = this.getNesting('pmd_switch');
		if (!pmd_switch) {return;}

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

if ( typeof window === "object" && typeof window.document === "object" ) {
	window.provoda = provoda;
}
return provoda;
});
