define(function(require) {
'use strict';
var spv = require('spv');

var SongUI = require('./SongUI');

return spv.inh(SongUI, {}, {
  base_tree: {
    sample_name: 'current-song-view'
  },
  children_views: {
    'vis_neig_prev': SongUI.SongViewLite,
    'vis_neig_next': SongUI.SongViewLite
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
