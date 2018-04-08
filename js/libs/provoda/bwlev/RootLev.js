define(function(require) {
'use strict';
var Model = require('../Model');
var spv = require('spv');
var getUsageStruc = require('../structure/getUsageStruc');
var BrowseLevel = require('./BrowseLevel');
var handleSpyglassRequests = require('../dcl/spyglass/handleRequest')

var Probe = spv.inh(Model, {
  naming: function(fn) {
		return function Probe(opts, data, params, more, states) {
			fn(this, opts, data, params, more, states);
		};
	},
  init: function(self) {
    self.bwlevs = {};
  },
}, {
  'stch-used_struc': function(self, value) {
    console.log('GOT used_struc', value);
  },
  '+states': {
    struc: [
      "compx", ['used_struc', '@current_md', 'name'],
  		function(struc, pioneer, probe_name) {
  			// if (num == -2) {return}
  			if (!struc || !pioneer || !probe_name) {return;}
  			return getUsageStruc(pioneer, probe_name, struc, this.app);
  		}
  	],
  }
  // 'compx-struc': [
  //   ['@one:struc:owner_bwlev', 'name'],
  //   function(struc, name) {
  //     if (!struc) {return;}
  //
  //     console.log('---------Probe', name, struc.main.m_children.children);
  //     return struc.main.m_children[name];
  //   }
  // ]
});

var RootLev = spv.inh(BrowseLevel, {}, {
  'chi-__probe': Probe,
  rpc_legacy: {
    requestSpyglass: handleSpyglassRequests,
  },
})

return RootLev;
});
