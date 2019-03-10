define(function (require) {
'use strict';

var cloneObj = require('spv').cloneObj;
var initSubPager = require('../dcl/sub_pager/init');

function buildHead(self, data) {
  var head = null;

  if (self.map_parent && self.map_parent.head) {
    if (!head) {head = {};}
    cloneObj(head, self.map_parent.head);
  }

  if (data && data.head) {
    if (!head) {head = {};}
    cloneObj(head, data.head);
  }


  if (self.network_data_as_states && data && data.network_states) {
    toServStates(self, data.network_states);

    if (self.net_head) {
      if (!head) {head = {};}
      for (var i = 0; i < self.net_head.length; i++) {
        var pk = self.net_head[i];
        head[pk] = data.network_states[pk];
      }
    }
  }

  return head
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

  initSubPager(self);

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
  self.shared_nest_sel_hands = null;

  self.head = buildHead(self, data)

  prepareStates(self, data, states)

  return self;
};

function toServStates(self, states) {
  if (!states) {return;}

  if (!self.init_service_states) {
    self.init_service_states = {};
  }

  cloneObj(self.init_service_states, states);
}

function prepareStates(self, data, states) {
  self.init_states = self.init_states || null;

  self.init_service_states = null;

  toServStates(self, states);
  toServStates(self, data && data.states);

  toServStates(self, self.head);

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


}
});
