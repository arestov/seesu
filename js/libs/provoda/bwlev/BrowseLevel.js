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

var countKeys = spv.countKeys;
var cloneObj = spv.cloneObj;

var transportName = function(spyglass_name) {
  return 'spyglass__' + spyglass_name.replace('/', '__');
}

var BrowseLevel = spv.inh(Model, {
  strict: true,
  naming: function(fn) {
    return function BrowseLevel(opts, data, params, more, states) {
      fn(this, opts, data, params, more, states);
    };
  },
  init: function(self, opts, data, params, more, states) {
    self.children_bwlevs = {};

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
  }
}, {
  model_name: 'bwlev',
  "+states": {
    "source_of_item": [
      'compx',
      ['@pioneer'],
      function(pioneer) {
        if (!pioneer) {
          return;
        }

        return pioneer._network_source
      }
    ],
    "sources_of_item_details_by_space": [
      "compx",
      ['struc', '@pioneer'],
      function(struc, pioneer) {
        if (!pioneer) {return;}

        return getStrucSources(pioneer, struc)
      }
    ],

    "struc": [
      "compx",
      ['@one:used_data_structure:map', '@pioneer', 'map_level_num', 'probe_name'],
      function(struc, pioneer, num, probe_name) {

        if (num == -2) {return}

        if (!struc || !pioneer || !probe_name) {return;}

        if (!struc.m_children.children) {
          console.warn('add struct')
          return
        }

        var spyglass_view_name = transportName(probe_name)
        var sub_struc = struc.m_children.children[spyglass_view_name].main;
        return getUsageStruc(pioneer, 'map_slice', sub_struc, this.app);
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

    "__struc_list": [
      "compx",
      ['struc'],
      function(struc) {
        if (!this.getNesting('pioneer') || !struc) {return;}
        return flatStruc(this.getNesting('pioneer'), struc);
      }
    ],

    "__supervision": [
      "compx",
      [],
      function () {
          return {
            needy_id: this._provoda_id,
            store: {},
            reqs: {},
            is_active: {}
          };
        }
    ],

    "__to_load_all": [
      "compx",
      ['mp_dft', '__struc_list', '__supervision'],
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
    return bwlev;
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

  'stch-__to_load_all': function(target, obj, prev) {
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
