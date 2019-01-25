define(function(require){
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../utils/getPropsPrefixChecker');

var spv = require('spv');
var utils = require('./effects/legacy/utils')
var NestReqMap = require('./effects/legacy/nest_req/dcl')
var StateReqMap = require('./effects/legacy/state_req/dcl')

var stateName = utils.stateName


var getUnprefixed = spv.getDeprefixFunc( 'nest_req-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );

function NestReqMapCopy(nest_declr, is_main) {
  this.original = nest_declr;

  this.nest_name = nest_declr.nest_name;
  this.parse_items = nest_declr.parse_items;
  this.parse_serv = nest_declr.parse_serv;
  this.side_data_parsers = nest_declr.side_data_parsers;
  this.send_declr = nest_declr.send_declr;
  this.dependencies = nest_declr.dependencies;
  this.state_dep = nest_declr.state_dep;

  if (!is_main) {
    return;
  }

  var more = ['can_load_data'];
  this.dependencies = !this.dependencies
    ? more
    : this.dependencies.concat(more);

  this.state_dep = stateName(this.nest_name);

}

var doIndex = function(list, value) {
  var result = [];

  for (var i = 0; i < list.length; i++) {
    var states_list = list[i].states_list;
    if (states_list.indexOf(value) != -1) {
      result.push(list[i]);
    }
  }

  return result;
};

var assign = function(typed_state_dcls, nest_declr) {
  typed_state_dcls['compx'] = typed_state_dcls['compx'] || {};
  typed_state_dcls['compx'][nest_declr.state_dep] = [nest_declr.dependencies, spv.hasEveryArgs];
};

var changeSources = function(store, send_declr) {
  var api_name = send_declr.api_name;
  if (typeof api_name == 'string') {
    store.api_names.push(api_name);
  } else {
    var network_api = api_name.call();
    if (!network_api.source_name) {
      throw new Error('no source_name');
    }
    store.sources_names.push(network_api.source_name);
  }
};

function buildStateReqs (self, list) {
  self._states_reqs_index = {};
  var states_index = {};

  for (var i = 0; i < list.length; i++) {
    var states_list = list[i].states_list;
    for (var jj = 0; jj < states_list.length; jj++) {
      states_index[states_list[jj]] = true;
    }
  }
  for (var state_name in states_index) {
    self._states_reqs_index[state_name] = doIndex(list, state_name);
  }
}

return function(self, props, typed_state_dcls) {
  var i;

  var has_changes = false;

  if (props.hasOwnProperty('req_map')) {
    self.netsources_of_states = {
      api_names: [],
      api_names_converted: false,
      sources_names: []
    };
    has_changes = true;

    var list = new Array(props.req_map.length);
    for (var i = 0; i < props.req_map.length; i++) {
      list[i] = new StateReqMap(props.req_map[i], i);
    }
    for (var i = 0; i < list.length; i++) {
      changeSources(self.netsources_of_states, list[i].send_declr);

    }

    buildStateReqs(self, list)
  }

  var has_reqnest_decls = hasPrefixedProps(props);

  var main_list_nest_req = self.main_list_nest_req;

  if (has_reqnest_decls) {
    self.netsources_of_nestings = {
      api_names: [],
      api_names_converted: false,
      sources_names: []
    };
    has_changes = true;
    for (var prop_name in props) {
      if (props.hasOwnProperty(prop_name) && getUnprefixed(prop_name) ) {
        var nest_name = getUnprefixed(prop_name);
        var nest_declr = new NestReqMap(props[ prop_name ], nest_name);

        changeSources(self.netsources_of_nestings, nest_declr.send_declr);

        var is_main = nest_name == self.main_list_name;
        // if (is_main) {
        // 	debugger;
        // }
        var cur_nest = !is_main ? nest_declr : new NestReqMapCopy(nest_declr, is_main);
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
