define(function(require){
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../utils/getPropsPrefixChecker');

var spv = require('spv');
var utils = require('./effects/legacy/utils')
var changeSources = require('./effects/legacy/utils/changeSources')
var NestReqMap = require('./effects/legacy/nest_req/dcl')
var StateReqMap = require('./effects/legacy/state_req/dcl')
var buildStateReqs = require('./effects/legacy/state_req/rebuild')

var stateName = utils.stateName


var getUnprefixed = spv.getDeprefixFunc( 'nest_req-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );

var assign = function(typed_state_dcls, nest_declr) {
  typed_state_dcls['compx'] = typed_state_dcls['compx'] || {};
  typed_state_dcls['compx'][nest_declr.state_dep] = [nest_declr.dependencies, spv.hasEveryArgs];
};

function buildNestReqs(self, props, typed_state_dcls) {
  self.netsources_of_nestings = {
    api_names: [],
    api_names_converted: false,
    sources_names: []
  };

  for (var prop_name in props) {
    if (!props.hasOwnProperty(prop_name) || !getUnprefixed(prop_name) ) {
      continue;
    }
    var nest_name = getUnprefixed(prop_name);
    var nest_declr = new NestReqMap(nest_name, props[ prop_name ]);

    changeSources(self.netsources_of_nestings, nest_declr.send_declr);

    var is_main = nest_name == self.main_list_name;
    // if (is_main) {
    // 	debugger;
    // }
    var cur_nest = nest_declr;
    self[prop_name] = cur_nest;

    if (!cur_nest.state_dep) {
      continue;
    }

    assign(typed_state_dcls, cur_nest);

    if (!is_main) {
      continue;
    }


    self.main_list_nest_req = cur_nest;
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

  var has_reqnest_decls = hasPrefixedProps(props);

  var main_list_nest_req = self.main_list_nest_req;

  if (has_reqnest_decls) {
    has_changes = true;
    buildNestReqs(self, props, typed_state_dcls)
  }

  if (props.hasOwnProperty('main_list_nest_req') && main_list_nest_req && main_list_nest_req.nest_name !== props.main_list_name) {
    assign(typed_state_dcls, main_list_nest_req.original);
    self['nest_req-' + main_list_nest_req.nest_name] = main_list_nest_req.original;
  }

  if (has_changes) {
    self.netsources_of_all = {
      nestings: self.netsources_of_nestings,
      states: self.netsources_of_states
    };
  }
};


});
