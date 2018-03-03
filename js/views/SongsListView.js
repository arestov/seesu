define(function(require) {
'use strict';
var $ = require('jquery');
var SongUI = require('./SongUI');
var etc_views = require('./etc_views');
var coct = require('./coct');
var spv = require('spv');
var View = require('View');
var ActionsRowUI = require('./common/ActionsRowUI');

  var PlaylistSettingsRowView = spv.inh(View, {}, {
    "stch-dont_rept_pl": function(target, state) {
      target.dont_rept_pl_chbx.prop('checked', !!state);
    },
    bindBase: function() {
      var _this = this;
      this.dont_rept_pl_chbx = this.tpl.ancs['dont-rept-pl'].click(function() {
        _this.RPCLegacy('setDnRp', $(this).prop('checked'));
      });

    }
  });

  var PlARowView = spv.inh(ActionsRowUI, {}, {

    canUseWaypoints: function() {
      return this.parent_view.state('mp_has_focus');
    },
    children_views_by_mn: {
      context_parts: {
        "row-multiatcs": View,
        "row-pl-settings": PlaylistSettingsRowView
      }
    }
  });

  var SongsListViewBase = spv.inh(coct.SPView, {}, {
    'collch-songs-list': {
      place: 'tpl.ancs.lc',
      space: 'main'
    },
    'coll-prio-songs-list': function(array) {
      var viewing = [], prev_next = [], play = [];//, others = [];
      for (var i = array.length - 1; i >= 0; i--) {
        var cur = array[i];
        var states = cur.states;
        if (states.mp_show || states.mpl_attached){
          viewing.push(cur);
        } else if (states.marked_as){
          prev_next.push(cur);
        } else if (states.player_song){
          play.push(cur);
        } /*else {
        //	others.push(cur);
        }*/
      }
      var result = [];
      if (viewing.length){
        result.push(viewing);
      }
      if (prev_next.length){
        result.push(prev_next);
      }
      if (play.length){
        result.push(play);
      }
      /*if (others.length){
        result.push(others);
      }*/
      return result;
      /*
      player_song
      marked_as
      vmp_show



      */

    }
  });
  var SongsListView = spv.inh(SongsListViewBase, {}, {
    base_tree: {
      sample_name: 'playlist-container'
    },
    children_views: {
      plarow: PlARowView,
      'songs-list': SongUI.SongViewLite
    },
    expandBase: function() {
      this.setVisState('overview', true);
    }
  });
  var SongsListDetailedView = spv.inh(SongsListViewBase, {}, {
    base_tree: {
      sample_name: 'playlist-container'
    },
    children_views: {
      plarow: PlARowView,
      'songs-list': SongUI
    }
  });

  SongsListView.SongsListDetailedView = SongsListDetailedView;

return SongsListView;
});
