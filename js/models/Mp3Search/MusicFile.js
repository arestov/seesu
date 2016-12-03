define(function (require) {
'use strict';
var spv = require('spv');
var pv = require('pv');
var SongFileModel = require('../SongFileModel');
var QMI = require('./QMI');
var getQMSongIndex = QMI.getQMSongIndex;


var Match = pv.behavior({
  'compx-index_value': [
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
  ]
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
          customer: 'simple_name'
        }
      ],
    }
  }
});

return MusicFile;
});
