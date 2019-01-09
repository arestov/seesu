define(function(require){
'use strict';
var spv = require('spv');
var getPropsPrefixChecker = require('../utils/getPropsPrefixChecker');
var splitByDot = spv.splitByDot

var getUnprefixed = spv.getDeprefixFunc( 'nest_req-' );
var hasPrefixedProps = getPropsPrefixChecker( getUnprefixed );

var apiDeclr = spv.memorize(function(name) {
  var parts = splitByDot(name);
  return {
    name: parts[0],
    resource_path: parts.length > 1 ? parts.slice(1) : null
  };
});

var counter = 1;

function SendDeclaration(declr) {
  this.id = counter++;
  this.api_name = null;
  this.api_resource_path = null;

  if (typeof declr[0] == 'function') {
    this.api_name = declr[0];
  } else {
    var api_declr = apiDeclr(declr[0]);
    this.api_name = api_declr.name;
    this.api_resource_path = api_declr.resource_path;
  }

  this.api_method_name = null;
  this.manual = null;
  this.ids_declr = null;

  if (typeof declr[1] =='string') {
    this.api_method_name = declr[1];
  } else if (Array.isArray(declr[1])) {
    var manual = declr[1];
    this.manual = {
      dependencies: manual[0],
      fn: manual[1],
      fn_body: manual[1].toString()
    };
  } else if (declr[1].arrayof) {
    this.ids_declr = declr[1];
    this.ids_declr.fn_body = this.ids_declr.req.toString();
  }

  this.getArgs = declr[2];
  this.non_standart_api_opts = declr[3];
}

function toSchemaFn(mmap) {
  if (typeof mmap == 'function') {
    return mmap
  }

  return spv.mmap( mmap );
}


function ReqMap(req_item, num) {
  this.num = num;
  this.dependencies = null;
  this.send_declr = null;
  this.states_list = null;
  this.parse = null;

  if (!Array.isArray(req_item)) {
    this.parse = toSchemaFn(req_item.parse);
    this.states_list = req_item.states
    this.dependencies = req_item.fn[0]
    this.send_declr = new SendDeclaration([req_item.api, req_item.fn]);
    return
  }

  var relations = req_item[0];
  if (Array.isArray(relations[0])) {
    throw new Error('wrong');
  } else {
  }

  this.states_list = relations;

  this.parse = toSchemaFn(req_item[1]);
  var send_declr = req_item[2];

  if (!Array.isArray(send_declr[0])) {
    this.send_declr = new SendDeclaration(send_declr);
  } else {
    this.dependencies = send_declr[0];
    this.send_declr = new SendDeclaration(send_declr[1]);
  }
}

function stateName(name) {
  return '$__can_load_' + name;
}

function toSchemaFn(mmap) {
  if (!mmap) {
    return null
  }

  if (!mmap) {
    debugger
  }
  if (typeof mmap == 'function') {
    return mmap
  }

  return spv.mmap(mmap);
}

function NestReqMap(dclt, name) {
  this.original = this;
  this.nest_name = name;
  this.parse_items = null;
  this.parse_serv = null;
  this.side_data_parsers = null;
  this.send_declr = null;
  this.dependencies = null;
  this.state_dep = null;


  if (!Array.isArray(dclt)) {
    var parse = dclt.parse
    this.parse_items = toSchemaFn(parse[0]);
    this.parse_serv = parse[1] === true
      ? true
      : toSchemaFn(parse[1]);
    this.side_data_parsers = toSchemaFn(parse[2]);
    this.send_declr = new SendDeclaration([dclt.api, dclt.fn]);
    this.dependencies = dclt.fn[0] || null

    if (this.dependencies) {
      this.state_dep = stateName(this.nest_name);
    }

    return
  }

  if (typeof dclt[0][0] != 'function') {
    dclt[0][0] = toSchemaFn(dclt[0][0]);
  }
  if (dclt[0][1] && dclt[0][1] !== true && typeof dclt[0][1] != 'function') {
    dclt[0][1] = toSchemaFn(dclt[0][1]);
  }
  var array = dclt[0][2];
  if (array) {
    for (var i = 0; i < array.length; i++) {
      var spec_cur = array[i];
      if (typeof spec_cur[1] != 'function') {
        spec_cur[1] = spv.mmap(spec_cur[1]);
      }
    }
  }
  this.parse_items = dclt[0][0];
  this.parse_serv = dclt[0][1];
  this.side_data_parsers = dclt[0][2];

  var send_declr = dclt[1];
  if (!Array.isArray(send_declr[0])) {
    this.send_declr = new SendDeclaration(send_declr);
  } else {
    this.dependencies = send_declr[0];
    this.send_declr = new SendDeclaration(send_declr[1]);
  }


  if (this.dependencies) {
    this.state_dep = stateName(this.nest_name);
  }

}

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
      list[i] = new ReqMap(props.req_map[i], i);
    }
    for (var i = 0; i < list.length; i++) {
      changeSources(self.netsources_of_states, list[i].send_declr);

    }

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
