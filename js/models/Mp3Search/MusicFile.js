define(function (require) {
'use strict';
var spv = require('spv');
var pv = require('pv');
var pvUpdate = require('pv/update');
var SongFileModelBase = require('./SongFileModel').SongFileModelBase;
var QMI = require('./QMI');
var getQMSongIndex = QMI.getQMSongIndex;

var Match = pv.behavior({
  "+states": {
    "searches_pr": [
      "compx",
      ['#mp3_search_order']
    ],

    "duration": ["compx", ['^duration']],

    "index_value": [
      "compx",
      ['msq', '^artist', '^track', '^description'],
      function (msq, artist, track, description) {
        if (!msq || !artist) {
          return -1;
        }

        return getQMSongIndex(msq, {
          artist: artist,
          track: track,
          description: description,
        });
      }
    ],

    "duration_diff": [
      "compx",
      ['duration', '@one:average_dur:match_group'],
      function (duration, average_dur) {
        if (!duration || typeof average_dur != 'number') {
          return Infinity;
        }
        return Math.abs(duration - average_dur * 1000);
      }
    ],

    "search_order": [
      "compx",
      ['search_name', '#mp3_search_order'],
      function (search_name, searches_pr) {
        if (!search_name || !searches_pr || !searches_pr.hasOwnProperty(search_name)) {
          return Infinity;
        }
        return -searches_pr[search_name];
      }
    ],

    "matched_order": [
      "compx",
      ['index_value', 'search_order', 'duration_diff',],
      function (index_value, search_order, duration_diff) {
        // qmi
        // search name order
        // time diff
        return [index_value == -1 ? Infinity : index_value, search_order, duration_diff];
      }
    ],

    "allow_grouping": [
      "compx",
      ['index_value'],
      function (value) {
        return typeof value == 'number' && value != -1;
      }
    ]
  },

  'nest-match_group': ['#mp3_search/lookups/[:artist_name],[:track_title]/[:search_name]/duration_groups/[:index_value]', {
    ask_for: 'allow_grouping'
  }]
});

var SongFileModel = pv.behavior({
  "+states": {
    "artist": ["compx", ['^artist']],
    "track": ["compx", ['^track']],
    "from": ["compx", ['^from']],
    "page_link": ["compx", ['^page_link']],
    "link": ["compx", ['^link']],
    "duration": ["compx", ['^duration']]
  },

  markParentFailed: function (fails) {
    pvUpdate(this.map_parent, 'unavailable', fails);
  }
}, SongFileModelBase, {
  init: function (self) {
    self.mo = pv.getModelById(self, self.head.mf_cor_id).map_parent;
  }
});

var MusicFile = spv.inh(pv.Model, {
  naming: function(fn) {
    return function MusicFile(opts, data, params, more, states) {
      fn(this, opts, data, params, more, states);
    };
  }
}, {
  sub_pager: {
    type: {
      match_ratings: 'match',
      playable_files: 'file'
    },
    by_type: {
      match: [
        Match, null, {
          search_name: 'by_comma.0',
          artist_name: 'by_comma.1',
          track_title: 'by_comma.2',
          'msq.artist': 'by_comma.1',
          'msq.track': 'by_comma.2',
        }
      ],
      file: [
        SongFileModel, null, {
          mf_cor_id: 'by_slash.0'
        }
      ],
    }
  }
});

return MusicFile;
});
