define(function(require) {
'use strict'
var spv = require('spv');
var View = require('View');

var nav = require('./nav');

var BrowseLevNavView = spv.inh(View, {}, {
  "+states": {
    "nav_clickable": [
      "compx",
      ['mp_stack', 'mp_has_focus'],
      function(mp_stack, mp_has_focus) {
        return !mp_has_focus && (mp_stack == 'root' || mp_stack == 'top');
      }
    ],

    "mp_stack_root_follower": [
      "compx",
      ['$index', '$index_back', 'vmp_show'],
      function (index, index_back) {
        if (index == 0) {
          return;
        }

        if (index_back == 0) {
          // title
          return;
        }

        return index == 1;
      }
    ],

    "mp_stack": [
      "compx",
      ['$index', '$index_back', 'vmp_show'],
      function (index, index_back, vmp_show) {
        if (index == 0) {
          return vmp_show && 'root';
        }

        if (index_back == 0) {
          // title
          return;
        }

        if (index_back == 1) {
          return 'top';
        }

        if (index == 1) {
          return 'bottom';
        }

        return 'middle';
      }
    ]
  },

  base_tree: {
    sample_name: 'brow_lev_nav'
  },

  children_views_by_mn: {
    pioneer: {
      $default: nav.baseNavUI,
      start_page: nav.StartPageNavView,
      invstg: nav.investgNavUI
    }
  },

  'collch-pioneer': {
    by_model_name: true,
    place: 'c'
  }
});

return BrowseLevNavView;
})
