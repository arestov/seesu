define(['spv', './FastEventor', './helpers'], function(spv, getFastEventor, hp) {
'use strict';
return function(main_calls_flow) {
var FastEventor = getFastEventor(main_calls_flow);



var Eventor = spv.inh(function() {}, {
	naming: function(construct) {
		return function Eventor() {
			construct(this);
		};
	},
	building: function(parentBuilder) {
		return function EventorBuilder(obj) {
			parentBuilder(obj);

			obj.evcompanion = new FastEventor(obj);
		};
	},
	props: {
		// init: function(){
		// 	this.evcompanion = new FastEventor(this);
		// 	return this;
		// },
		_getCallsFlow: function() {
			return main_calls_flow;
		},
		useMotivator: function(item, fn, motivator) {
			var old_value = item.current_motivator;
			motivator = motivator || this.current_motivator;
			item.current_motivator = motivator;
			var result = fn.call(this, item);
			item.current_motivator = old_value;
			return result;
		},
		nextLocalTick: function(fn, args, use_current_motivator, finup) {
			return this._getCallsFlow().pushToFlow(fn, this, args, false, hp.oop_ext.hndMotivationWrappper, this, use_current_motivator && this.current_motivator, finup);
		},
		nextTick: function(fn, args, use_current_motivator) {
			return main_calls_flow.pushToFlow(fn, this, args, !args && this, hp.oop_ext.hndMotivationWrappper, this, use_current_motivator && this.current_motivator);
		},
		once: function(namespace, cb, opts, context) {
			return this.evcompanion.once(namespace, cb, opts, context);
		},
		on: function(namespace, cb, opts, context) {
			return this.evcompanion.on(namespace, cb, opts, context);
		},
		off: function(namespace, cb, obj, context) {
			return this.evcompanion.off(namespace, cb, obj, context);
		},
		trigger: function() {
			this.evcompanion.trigger.apply(this.evcompanion, arguments);
		},

		addRequest: function() {
			return this.evcompanion.addRequest.apply(this.evcompanion, arguments);
		},
		addRequests: function() {
			return this.evcompanion.addRequests.apply(this.evcompanion, arguments);
		},
		stopRequests: function() {
			return this.evcompanion.stopRequests.apply(this.evcompanion, arguments);
		},
		getRelativeRequestsGroups: function() {

		},
		getModelImmediateRequests: function() {
			return this.evcompanion.getModelImmediateRequests.apply(this.evcompanion, arguments);
		},
		setPrio: function() {
			return this.evcompanion.setPrio.apply(this.evcompanion, arguments);
		},
		requestState: function() {
			return this.evcompanion.requestState.apply(this.evcompanion, arguments);
		},
		requestNesting: function() {
			return this.evcompanion.requestNesting.apply(this.evcompanion, arguments);
		}
	}
});

// function Eventor () {}
// spv.Class.extendTo(Eventor, );
return Eventor;
};
});
