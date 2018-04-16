define(function(require) {
'use strict';
var Model = require('../Model');
var spv = require('spv');
var getUsageStruc = require('../structure/getUsageStruc');
var BrowseLevel = require('./BrowseLevel');
var handleSpyglassRequests = require('../dcl/spyglass/handleRequest')
var updateSpyglass = require('../dcl/spyglass/update');
var getNesting = require('pv/getNesting');
var requestPage = require('./requestPage');
var pvState = require('pv/state');
var showMOnMap = require('./showMOnMap');
var getModelById = require('../utils/getModelById');


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

var RootLev = spv.inh(Model, {}, {
  BWL: BrowseLevel,
  'chi-__probe': Probe,
  rpc_legacy: {
    requestSpyglass: handleSpyglassRequests,
    requestPage: function(id) {
      var md = getModelById(this, id);
      var bwlev = showMOnMap(BrowseLevel, this, md)
      bwlev.showOnMap();
    },
  },
  updateSpyglass: function(data) {
    updateSpyglass(BrowseLevel, this, data);
  },
  toggleSpyglass: function(data) {
    updateSpyglass.toggle(BrowseLevel, this, data);
  },
  spyglassURL: function(name, pattern, data) {
    // navigation, "/tags/[:tag]" {tag: "tgbbb"}
  },
  'stch-has_no_access@wanted_bwlev_chain.pioneer': function(target, state, old_state, source) {
    var map = target;

    var list = getNesting(map, 'wanted_bwlev_chain');
    if (!list) {
      return;
    }

    // start_page/level/i===0 can't have `Boolean(has_no_access) === true`. so ok_bwlev = 0
    var ok_bwlev = 0;

    for (var i = 0; i < list.length; i++) {
      var cur_bwlev = list[i];
      var md = getNesting(cur_bwlev, 'pioneer');
      var has_no_access = pvState(md, 'has_no_access');
      if (has_no_access) {
        break;
      }
      ok_bwlev = i;
    }

    var bwlev = list[ok_bwlev];

    map.trigger('bridge-changed', bwlev);
    map.updateNesting('selected__bwlev', bwlev);
    map.updateNesting('selected__md', bwlev.getNesting('pioneer'));
    map.updateState('selected__name', bwlev.model_name);

    askAuth(list[ok_bwlev + 1]);
  }

})

function askAuth(bwlev) {
  if (!bwlev) {return;}

  getNesting(bwlev, 'pioneer').switchPmd();
}

return RootLev;
});
