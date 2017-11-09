define(function(require) {
'use strict';

var prsStCon = require('../prsStCon');

var spv = require('spv');
var hp = require('../helpers');

var getUnprefixed = spv.getDeprefixFunc( 'compx-' );
var hasPrefixedProps = hp.getPropsPrefixChecker( getUnprefixed );

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

var collectCompxs1part = function(self, props) {
  var build_index = self._build_cache_compx_one;
  self._build_cache_compx_one = {};

  for (var prefixed_name in self){
    var comlx_name = getUnprefixed(prefixed_name);
    if (comlx_name){
      var cur = self[prefixed_name];
      if (!cur) {continue;}

      var item;
      if (props.hasOwnProperty(prefixed_name)) {
        item = declr(comlx_name, cur);
      } else {
        item = build_index[comlx_name];
      }

      self._build_cache_compx_one[comlx_name] = item;
    }
  }
};

var collectCompxs2part = function(self) {
  self._build_cache_compx_many = {};
  for (var comlx_name in self.complex_states){
    var cur = self.complex_states[comlx_name];
    if (!cur) {continue;}

    var item = declr(comlx_name, cur);
    self._build_cache_compx_many[comlx_name] = item;
  }
};
return function(self, props) {

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


  var part1 = hasPrefixedProps(props);
  var part2 = self.hasOwnProperty('complex_states');
  var need_recalc = part1 || part2;

  if (!need_recalc){
    return;
  }

  for (var prop in props.complex_states) {
    if (props['compx-' + prop]) {
      throw new Error('can`t be (in one layer) compx in both `complex_states` and "compx-"' + prop);
    }
  }

  if (part1) {
    collectCompxs1part(self, props);
  }

  if (part2) {
    collectCompxs2part(self);
  }

  var compx_check = {};
  var full_comlxs_list = [];

  for (var key_name_one in self._build_cache_compx_one) {
    compx_check[key_name_one] = self._build_cache_compx_one[key_name_one];
    full_comlxs_list.push(compx_check[key_name_one]);
  }

  for (var key_name_many in self._build_cache_compx_many) {
    if (compx_check[key_name_many]) {continue;}

    compx_check[key_name_many] = self._build_cache_compx_many[key_name_many];
    full_comlxs_list.push(compx_check[key_name_many]);
  }


  self.compx_check = compx_check;
  self.full_comlxs_list = full_comlxs_list;
  self.full_comlxs_index = makeWatchIndex(self.full_comlxs_list);

  collectStatesConnectionsProps(self, full_comlxs_list);

  return true;
};

function collectStatesConnectionsProps(self, full_comlxs_list) {
  /*
  'compx-some_state': [['^visible', '@some:complete:list', '#vk_id'], function(visible, complete){

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
