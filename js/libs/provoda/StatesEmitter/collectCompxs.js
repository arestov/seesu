define(function(require) {
'use strict';

var prsStCon = require('../prsStCon');

var spv = require('spv');
var hp = require('../helpers');


var identical = function(state) {
  return state;
};

var fromArray = function(state_name, cur) {
  return {
    depends_on: cur[0] || [],
    fn: cur[1],
    name: state_name,
    watch_list: null
  };
};

var declr = function(comlx_name, cur) {
  var item = cur instanceof Array ? fromArray(comlx_name, cur) : cur;
  item.name = comlx_name;

  if (!item.depends_on.length && typeof item.fn !== 'function') {
    var value = item.fn;
    item.fn = function() {
      return value;
    };
  }

  if (!item.fn) {
    item.fn = identical;
  }
  if (!Array.isArray(item.depends_on)) {
    throw new Error('should be list');
  }

  item.watch_list = new Array(item.depends_on.length || 0);

  for (var i = 0; i < item.depends_on.length; i++) {
    if (!item.depends_on[i]) {
      throw new Error('state name should not be empty');
    }
    item.watch_list[i] = hp.getShortStateName(item.depends_on[i]);
  }
  return item;
};


var collectBuildParts = function(self) {
  var compx_check = {};
  var full_comlxs_list = [];

  for (var key_name_one in self._dcl_cache__compx) {
    compx_check[key_name_one] = self._dcl_cache__compx[key_name_one];
    full_comlxs_list.push(compx_check[key_name_one]);
  }

  self.compx_check = compx_check;
  self.full_comlxs_list = full_comlxs_list;
}

var makeWatchIndex = function(full_comlxs_list) {
  var full_comlxs_index = {};
  var i, jj, cur, state_name;
  for (i = 0; i < full_comlxs_list.length; i++) {
    cur = full_comlxs_list[i];
    for (jj = 0; jj < cur.watch_list.length; jj++) {
      state_name = cur.watch_list[jj];
      if (state_name === cur.name) {continue;}
      if (!full_comlxs_index[state_name]) {
        full_comlxs_index[state_name] = [];
      }
      full_comlxs_index[state_name].push(cur);
    }
  }
  return full_comlxs_index;
}

var extendTyped = function(self, typed_state_dcls) {
  var result = spv.cloneObj(null, self._dcl_cache__compx) || {};

  var extending_part = {};

  for (var name in typed_state_dcls) {
    if (!typed_state_dcls.hasOwnProperty(name)) {
      continue;
    }
    extending_part[name] = declr(name, typed_state_dcls[name]);
  }

  result = spv.cloneObj(result, extending_part);

  self._dcl_cache__compx = result;
};

return function(self, props, typed_part) {
  if (typed_part) {
    extendTyped(self, typed_part);
  }

  var need_recalc = typed_part;
  if (!need_recalc){
    return;
  }

  collectBuildParts(self);
  self.full_comlxs_index = makeWatchIndex(self.full_comlxs_list);

  collectStatesConnectionsProps(self, self.full_comlxs_list);

  return true;
};

function collectStatesConnectionsProps(self, full_comlxs_list) {
  /*

  [['^visible', '@some:complete:list', '#vk_id'], function(visible, complete){

  }]
  */
  /*
      nest_match: [
    ['songs-list', 'mf_cor', 'sorted_completcs']
  ]
  */

  self.compx_nest_matches = [];

  var states_of_parent = {};
  var states_of_nesting = {};
  var states_of_root = {};

  for (var i = 0; i < full_comlxs_list.length; i++) {
    var cur = full_comlxs_list[i];

    for (var jj = 0; jj < cur.depends_on.length; jj++) {
      var state_name = cur.depends_on[jj];
      var parsing_result = hp.getEncodedState(state_name);
      if (!parsing_result) {
        continue;
      }
      switch (parsing_result.rel_type) {
        case 'root': {
          if (!states_of_root[state_name]) {
            states_of_root[state_name] = parsing_result;
          }
        }
        break;
        case 'nesting': {
          if (!states_of_nesting[state_name]) {
            states_of_nesting[state_name] = parsing_result;
            self.compx_nest_matches.push( parsing_result.nwatch );
          }
        }
        break;
        case 'parent': {
          if (!states_of_parent[state_name]) {
            states_of_parent[state_name] = parsing_result;
          }
        }
        break;
      }
    }
  }

  self.conndst_parent = prsStCon.toList(states_of_parent);
  self.conndst_nesting = prsStCon.toList(states_of_nesting);
  self.conndst_root = prsStCon.toList(states_of_root);

}
});
