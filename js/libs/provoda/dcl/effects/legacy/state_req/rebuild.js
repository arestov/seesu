define(function(require) {
'use strict';

var changeSources = require('../utils/changeSources')

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


return function buildStateReqs (self, list) {
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

  self.netsources_of_states = {
    api_names: [],
    api_names_converted: false,
    sources_names: []
  };

  for (var i = 0; i < list.length; i++) {
    changeSources(self.netsources_of_states, list[i].send_declr);
  }
}

})
