define(function(require){
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../utils/getPropsPrefixChecker');
var checkPrefix = require('../StatesEmitter/checkPrefix');

var spv = require('spv');
var utils = require('./effects/legacy/utils')
var changeSources = require('./effects/legacy/utils/changeSources')
var assign = require('./effects/legacy/utils/assign')
var NestReqMap = require('./effects/legacy/nest_req/dcl')
var StateReqMap = require('./effects/legacy/state_req/dcl')
var buildStateReqs = require('./effects/legacy/state_req/rebuild')


var check = checkPrefix('nest_req-', NestReqMap, '_nest_reqs');

function buildNestReqs(self, by_name, typed_state_dcls) {
  self.main_list_nest_req = self.main_list_name && self._nest_reqs[self.main_list_name];

  self.netsources_of_nestings = {
    api_names: [],
    api_names_converted: false,
    sources_names: []
  };

  for (var nest_name in self._nest_reqs) {
    var cur_nest = self._nest_reqs[nest_name]
    changeSources(self.netsources_of_nestings, cur_nest.send_declr);

    if (!cur_nest.state_dep) {
      continue;
    }

    assign(typed_state_dcls, cur_nest);
  }
}

return function(self, props, typed_state_dcls) {
  var i;

  var has_changes = false;

  if (props.hasOwnProperty('req_map')) {

    has_changes = true;

    var list = new Array(props.req_map.length);
    for (var i = 0; i < props.req_map.length; i++) {
      list[i] = new StateReqMap(props.req_map[i], i);
    }

    buildStateReqs(self, list)
  }

  var main_list_nest_req = self.main_list_nest_req;

  var checked = check(self, props)
  if (checked) {
    has_changes = true;
    buildNestReqs(self, checked, typed_state_dcls)
  }

  if (props.hasOwnProperty('main_list_nest_req') && main_list_nest_req && main_list_nest_req.nest_name !== props.main_list_name) {
    assign(typed_state_dcls, main_list_nest_req.original);
    self._nest_reqs[main_list_nest_req.nest_name] = main_list_nest_req.original;
  }

  if (has_changes) {
    self.netsources_of_all = {
      nestings: self.netsources_of_nestings,
      states: self.netsources_of_states
    };
  }
};


});
