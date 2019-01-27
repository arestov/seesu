define(function(require){
'use strict';
var assign = require('./effects/legacy/utils/assign')

var StateReqMap = require('./effects/legacy/state_req/dcl')
var buildStateReqs = require('./effects/legacy/state_req/rebuild')

return function(self, props, typed_state_dcls) {
  if (props.hasOwnProperty('req_map')) {
    var list = new Array(props.req_map.length);
    for (var i = 0; i < props.req_map.length; i++) {
      list[i] = new StateReqMap(props.req_map[i], i);
    }

    buildStateReqs(self, list)
  }

  var main_list_nest_req = self.main_list_nest_req;

  if (props.hasOwnProperty('main_list_nest_req') && main_list_nest_req && main_list_nest_req.nest_name !== props.main_list_name) {
    assign(typed_state_dcls, main_list_nest_req.original);
    self._nest_reqs[main_list_nest_req.nest_name] = main_list_nest_req.original;
  }
};


});
