define(function(require) {
'use strict'
var spv = require('spv');
var View = require('View');
var pvUpdate = require('pv/update');
var pv = require('pv');

var used_struc_bhv = require('../utils/used_struc').bhv;

var BrowseLevView = spv.inh(View, {}, pv.mergeBhv({
  "+states": {
    "mp_show_end": [
      "compx",
      ['animation_started', 'animation_completed', 'vmp_show'],
      function(animation_started, animation_completed, vmp_show) {
        if (!animation_started){
          return vmp_show;
        } else {
          if (animation_started == animation_completed){
            return vmp_show;
          } else {
            return false;
          }
        }
      }
    ],
    'full_focus': [
      'compx',
      ['mp_show', 'mp_has_focus'],
      function(a, b) {
        return a && b;
      }
    ],
    'sources_of_item_details': [
      'compx',
      ['sources_of_item_details_by_space'],
      function(obj) {
        var nesting_space = this.nesting_space
        return obj && obj[nesting_space]
      }
    ],
    'map_slice_view_sources':[
      'compx',
      ['source_of_item', 'sources_of_item_details'],
      function(one, all) {
        if (!all) {
          return [one]
        }

        if (!one) {
          return all
        }

        var combined = all.slice()
        combined.unshift(one)

        var byKey = spv.makeIndexByField(combined);
        return Object.keys(byKey)
      }
    ]
  },

  'stch-full_focus': function(target, value) {
    if (!value) {
      return;
    }
    target.root_view.updateImportantBwlev(target)
  },

  base_tree: {
    sample_name: 'browse_lev_con'
  },

  'stch-map_slice_view_sources': function(target, state) {
    if (state) {
      if (target.location_name == 'map_slice-detailed') {
        return;
      }

      if (target.parent_view.parent_view != target.root_view || target.nesting_name != 'map_slice') {
        return
      }

      pvUpdate(target, 'view_sources', state);
    }
  },

  'collch-$spec_common-pioneer': {
    by_model_name: true,
    place: 'tpl.ancs.con'
  },

  'collch-$spec_det-pioneer': {
    space: 'all-sufficient-details',
    by_model_name: true,
    place: 'tpl.ancs.con'
  },

  'collch-$spec_noplace-pioneer': {
    by_model_name: true
  },

  // 'collch-$spec_wrapped-pioneer': {
  // 	is_wrapper_parent: '^',
  // 	space: 'all-sufficient-details',
  // 	by_model_name: true,
  // 	place: 'tpl.ancs.con'
  // },
  'sel-coll-pioneer//detailed':'$spec_det-pioneer',

  'sel-coll-pioneer/start_page': '$spec_noplace-pioneer',

  'sel-coll-pioneer': '$spec_common-pioneer',
}, used_struc_bhv));

return BrowseLevView;
})
