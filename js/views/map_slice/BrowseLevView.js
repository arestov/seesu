define(function(require) {
'use strict'
var spv = require('spv');
var View = require('View');
var pvUpdate = require('pv/update');
var pv = require('pv');

var map_slice_by_model = require('./pages/index');
var used_struc_bhv = require('../utils/used_struc').bhv;

var push = Array.prototype.push;

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
    ]
  },

  'stch-full_focus': function(target, value) {
    if (!value) {
      return;
    }
    target.root_view.updateImportantBwlev(target)
  },

  children_views_by_mn: {
    pioneer: map_slice_by_model
  },

  base_tree: {
    sample_name: 'browse_lev_con'
  },

  'stch-map_slice_view_sources': function(target, state) {
    if (state) {
      if (target.location_name == 'map_slice-detailed') {
        return;
      }

      if (target.parent_view.parent_view == target.root_view && target.nesting_name == 'map_slice') {
        var arr = [];
        if (state[0]) {
          arr.push(state[0]);
        }
        push.apply(arr, state[1][target.nesting_space]);
        pvUpdate(target, 'view_sources', arr);
      }

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

  // 'sel-coll-pioneer/song': '$spec_wrapped-pioneer',
  'sel-coll-pioneer': '$spec_common-pioneer'
}, used_struc_bhv));

return BrowseLevView;
})
