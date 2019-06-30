define(function(require) {
'use strict';

var spv = require('spv');
var FastEventor = require('./FastEventor/index');
var hp = require('./helpers');


var Eventor = spv.inh(function() {}, {
  naming: function(construct) {
    return function Eventor() {
      construct(this);
    };
  },
  init: function(self) {
    self.evcompanion = new FastEventor(self);
  },
  props: {
    // init: function(){
    // 	this.evcompanion = new FastEventor(this);
    // 	return this;
    // },
    _getCallsFlow: function() {
      // disable this._local_calls_flow || for some time!
      return this._calls_flow;
    },
    useMotivator: function(item, fn) {
      var old_value = item.current_motivator;
      var motivator = this.current_motivator;
      item.current_motivator = motivator;
      var result = fn.call(this, item);
      item.current_motivator = old_value;
      return result;
    },
    nextLocalTick: function(fn, args, use_current_motivator, finup) {
      return this._getCallsFlow().pushToFlow(fn, this, args, false, hp.oop_ext.hndMotivationWrappper, this, use_current_motivator && this.current_motivator, finup);
    },
    nextTick: function(fn, args, use_current_motivator, initiator) {
      return this._calls_flow.pushToFlow(
        fn, this, args, !args && this, hp.oop_ext.hndMotivationWrappper, this, use_current_motivator && this.current_motivator, false,
        initiator, fn.init_end
      );
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


var PublicEventor = spv.inh(Eventor, {
  init: function(self, opts) {
    if (!opts || !opts._highway) {
      throw new Error('pass _highway option');
    }
    self._highway = opts._highway;
    self._calls_flow = self._highway.calls_flow;
  }
});

Eventor.PublicEventor = PublicEventor;

return Eventor;
});
