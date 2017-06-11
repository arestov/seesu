define(function (require) {
'use strict';
var Model = require('../Model');
var mark = require('./mark');
var spv = require('spv');
var BrowseLevel = require('../bwlev/BrowseLevel');
var getUsageStruc = require('./getUsageStruc');

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
  'compx-struc': [
		['used_struc', '@current_md', 'name'],
		function(struc, pioneer, probe_name) {
			// if (num == -2) {return}
      debugger;
			if (!struc || !pioneer || !probe_name) {return;}
			return getUsageStruc(pioneer, probe_name, struc, this.app);
		}
	],
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

BrowseLevel.prototype.BWL = BrowseLevel;

return function prepare(root) {
  var augmented = spv.inh(root, {}, {
    'chi-__probe': Probe
  });
  return mark(augmented, augmented);
};

});
