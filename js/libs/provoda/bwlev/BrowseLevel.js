define(function (require) {
'use strict';
var spv = require('spv');

var Model = require('../Model');
var changeBridge = require('./changeBridge');
var requestPage = require('./requestPage');
var followFromTo = require('./followFromTo');

var getModelById = require('../utils/getModelById');
var pvUpdate = require('../updateProxy').update;
var pvState = require('../utils/state');

var flatStruc = require('../structure/flatStruc');
var getUsageStruc = require('../structure/getUsageStruc');
var initNestingsByStruc = require('../structure/reactions/initNestingsByStruc');
var loadNestingsByStruc = require('../structure/reactions/loadNestingsByStruc');
var loadAllByStruc = require('../structure/reactions/loadAllByStruc');
var getModelSources = require('../structure/getModelSources');

var watchAndCollectProbes = require('../dcl/probe/watch');
var updateProbe = require('../dcl/probe/updateProbe');
var updateSpyglass = require('../dcl/spyglass/update');

var countKeys = spv.countKeys;
var cloneObj = spv.cloneObj;


var BrowseLevel = spv.inh(Model, {
  strict: true,
  naming: function(fn) {
    return function BrowseLevel(opts, data, params, more, states) {
      fn(this, opts, data, params, more, states);
    };
  },
  init: function(self, opts, data, params, more, states) {
    self.children_bwlevs = {};

    self._run_probes = null;

    // self.model_name = states['model_name'];
    //
    // if (!self.model_name) {
    // 	throw new Error('must have model name');
    // }

    var pioneer = states['pioneer'];

    self.ptree = [self];
    self.rtree = [pioneer];

    if (self.map_parent) {
      self.ptree = self.ptree.concat(self.map_parent.ptree);
      self.rtree = self.rtree.concat(self.map_parent.rtree);
    }

    watchAndCollectProbes(self, pioneer);
  }
}, {
  updateSpyglass: function(data) {
    updateSpyglass(BrowseLevel, this, data);
  },
  toggleSpyglass: function(data) {
    updateSpyglass.toggle(BrowseLevel, this, data);
  },
  updateProbe: function(target_id, probe_name, value, probe_container_uri) {
    updateProbe(BrowseLevel, this, target_id, probe_name, value, probe_container_uri);
  },
  toggleProbe: function(target_id, probe_name, value, probe_container_uri) {
    updateProbe.toggleProbe(BrowseLevel, this, target_id, probe_name, value, probe_container_uri);
  },
  model_name: 'bwlev',
  "+states": {
    "map_slice_view_sources": [
      "compx",
      ['struc', '@pioneer'],
      function (struc, pioneer) {
        if (!pioneer) {return;}

        return [pioneer._network_source, getStrucSources(pioneer, struc)];
      }
    ],

    "struc": [
      "compx",
      ['@one:used_data_structure:map', '@pioneer', 'map_level_num', 'probe_name'],
      function(struc, pioneer, num, probe_name) {
        if (num == -2) {return}
        if (!struc || !pioneer || !probe_name) {return;}
        var sub_struc = struc.m_children.children.fake_spyglass.main;
        // TODO don't use fake_spyglass
        return getUsageStruc(pioneer, probe_name, sub_struc, this.app);
      }
    ],

    "to_init": [
      "compx",
      ['mp_dft', 'struc'],
      function(mp_dft, struc) {
        if (!mp_dft || mp_dft > 2 || !struc) {return;}
        return struc;
      }
    ],

    "to_load": [
      "compx",
      ['mp_dft', 'struc'],
      function(mp_dft, struc) {
        if (!mp_dft || mp_dft > 1 || !struc) {return;}
        return struc;
      }
    ],

    "struc_list": [
      "compx",
      ['struc'],
      function(struc) {
        if (!this.getNesting('pioneer') || !struc) {return;}
        return flatStruc(this.getNesting('pioneer'), struc);
      }
    ],

    "supervision": [
      "compx",
      [],
      function () {
          return {
            needy: this,
            store: {},
            reqs: {},
            is_active: {}
          };
        }
    ],

    "to_load_all": [
      "compx",
      ['mp_dft', 'struc_list', 'supervision'],
      function(mp_dft, struc, supervision) {
        return {
          inactive: !mp_dft || mp_dft > 1 || !struc,
          list: struc,
          supervision: supervision
        };
      }
    ]
  },

  getParentMapModel: function() {
    return this.map_parent;
  },

  showOnMap: function() {
    // !!!!showMOnMap(BrowseLevel, this.map, this.getNesting('pioneer'), this);
    changeBridge(this);
  },

  requestPage: function(id) {
    return requestPage(BrowseLevel, this, id);
  },

  zoomOut: function() {
    if (this.state('mp_show')) {
      changeBridge(this);
    }
  },

  followTo: function(id) {
    var md = getModelById(this, id);
    if (md.getRelativeModel) {
      md = md.getRelativeModel();
    }
    // md.requestPage();
    var bwlev = followFromTo(BrowseLevel, this.map, this, md);
    changeBridge(bwlev);
  },

  'stch-mpl_attached': function(target, state) {
    var md = target.getNesting('pioneer');
    var obj = pvState(md, 'bmpl_attached');
    obj = obj ? cloneObj({}, obj) : {};
    obj[target._provoda_id] = state;
    pvUpdate(md, 'bmpl_attached', obj);
    pvUpdate(md, 'mpl_attached', countKeys(obj, true));
  },

  'stch-to_init': function(target, struc) {
    if (!struc) {return;}

    // init nestings

    initNestingsByStruc(target.getNesting('pioneer'), struc);
  },

  'stch-to_load': function(target, struc) {
    if (!struc) {return;}

    // load nestings (simple)

    loadNestingsByStruc(target.getNesting('pioneer'), struc);
  },

  'stch-to_load_all': function(target, obj, prev) {
    if (!obj.list) {
      return;
    }

    if (obj.inactive == (prev && prev.inactive)) {
      return;
    }

    // load everything

    loadAllByStruc(target.getNesting('pioneer'), obj, prev);
  }
});

BrowseLevel.prototype.BWL = BrowseLevel;
// kinda hack TODO FIXME

function getStrucSources(md, struc) {
  //console.log(struc);
  var result = {};
  for (var space_name in struc) {
    result[space_name] = getModelSources(md.app, md, struc[space_name]);
    //var cur = struc[space_name];
  }
  return result;
  //console.log(md.model_name, md.constr_id, result);
};



return BrowseLevel;
});
