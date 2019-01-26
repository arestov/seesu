define(function(require) {
'use strict';
var changeSources = require('../utils/changeSources')
var assign = require('../utils/assign')

return function buildNestReqs(self, by_name, typed_state_dcls) {
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

})
