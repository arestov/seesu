define(function(require) {
'use strict';
var spv = require('spv');

var SongUI = require('./SongUI');
var SongActionsRowUI = require('./SongActionsRowUI');
var MfCorUI = require('./MfCorUI');
var ArtcardUI = require('./ArtcardUI');
var SongcardPage = require('./SongcardPage');

return spv.inh(SongUI, {}, {
  base_tree: {
    sample_name: 'current-song-view'
  },
  children_views: {
    'vis_neig_prev': SongUI.SongViewLite,
    'vis_neig_next': SongUI.SongViewLite,
    actionsrow: SongActionsRowUI,
    mf_cor: MfCorUI,
    artist: ArtcardUI.ArtistInSongConstroller,
    songcard: SongcardPage.SongcardController,
  },
  "+states": {
    "vmp_show": [
      'compx',
      ['^vmp_show'],
    ],
    "lvmp_show": [
      "compx",
      ['^vmp_show'],
    ],
    "mp_show_end": [
      "compx",
      ['^mp_show_end'],
      function(mp_show_end) {
        return mp_show_end;
      }
    ]
  }
})
});
