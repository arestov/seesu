define(function(require){
'use strict';
var checkPrefix = require('../StatesEmitter/checkPrefix');

var assign = require('./effects/legacy/utils/assign')
var NestReqMap = require('./effects/legacy/nest_req/dcl')
var buildNestReqs = require('./effects/legacy/nest_req/rebuild')

var StateReqMap = require('./effects/legacy/state_req/dcl')
var buildStateReqs = require('./effects/legacy/state_req/rebuild')


var check = checkPrefix('nest_req-', NestReqMap, '_nest_reqs');

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
