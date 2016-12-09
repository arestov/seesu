define(function (require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var compareArray = spv.compareArray;
var pvState = pv.state;
var QMI = require('./QMI');
var getQueryString = QMI.getQueryString;
var getAvg = require('./sortMusicFilesArray').getAvg;

function QMIKey(msq) {
  if (!msq) {return;}
  return getQueryString(msq).replace(/\./gi, '');
}

var DurationGroup = pv.behavior({
  DurationGroup: true,
  'nest_sel-filtered_music_files_matches': {
    from: '^>match_ratings',
    where: {
      '>index_value': ['=', 'index_value']
    }
  },
  'compx-average_dur': [
    ['@duration:filtered_music_files_matches'],
    getAvg
  ],
});

var FilesBySource = spv.inh(pv.Model, {
  init: function(target) {
    target.on('requests', function(requests) {
      this.map_parent.addRequests(requests);
    });
    //cache
    //network
    //scope
  }
}, {
  'nest-tuner': ['^^tuners/[:search_name]'],
  'compx-disable_search': [['@one:disable_search:tuner']],
  'compx-wait_before_playing': [['@one:wait_before_playing:tuner']],
  switchTunerVisibility: function() {
    var visible = this.getNesting('vis_tuner');
    pv.updateNesting(this, 'vis_tuner', ( visible ? null : this.getNesting('tuner') ) );
  },
  addFile: function(music_file) {
    var injected_music_files = this.getNesting('injected_music_files') || [];
    this.updateNesting('injected_music_files', injected_music_files.concat([music_file]));
  },
  sub_pager: {
    type: {
      duration_groups: 'duration_group',
    },
    by_type: {
      duration_group: [
        DurationGroup, null, {
          index_value: ['num', 'by_slash.0'],
        }
      ],
    }
  },
	'nest_sel-queried_music_files': {
		from: 'search_query.files'
	},
  'nest_cnt-music_files_list': ['queried_music_files', 'requested_music_files', 'injected_music_files'],
  'compx-qmi_key': [['msq'], QMIKey],
  'nest_sel-best_music_files': {
    from: 'match_ratings',
    map: '>^',
    where : {
      '>index_value': ['=', [0]]
    },
  },
  'nest_sel-music_files_sorted': {
    from: 'match_ratings',
    map: '>^'
  },
  'nest_sel-match_ratings_raw': {
    from: 'music_files_list',
    map: '>match_ratings/[:search_name],[:artist_name],[:track_title]'
  },
  'nest_sel-match_ratings': {
    from: 'match_ratings_raw',
    sort: [
      ['matched_order'],
      function (one, two) {
        var value_one = pvState(one, 'matched_order');
        var value_two = pvState(two, 'matched_order');
        return compareArray(value_one, value_two);
      }
    ]
  },
  'nest_sel-mp3files': {
    from: 'music_files_sorted',
    where: {
      '>media_type': ['=', ['mp3']]
    }
  },
  'nest_sel-able_to_play_mp3files': {
    from: 'mp3files',
    where: {
      '>unavailable': [['=', 'boolean'], [false]]
    }
  },
  complex_states: {
    'request_required': [
      ['disable_search', '^must_load'],
      function(disabled, must_load) {
        return !disabled && must_load;
      }
    ],
    'has_mp3_files': [['mp3files$exists']],
    'has_best_files': [['best_music_files$exists']],
    'has_files': [['music_files_list$exists']],
    'has_any_data': [
      ['has_files', 'search_complete'],
      function (has_files, search_complete) {
        return !!has_files || !!search_complete;
      }
    ]
  },
  'nest-source': ['#mp3_search/sources/[:search_name]'],
  'compx-dmca_url': [['@one:dmca_url:source']],
  'nest-search_query': ['#mp3_search/sources/[:search_name]/queries/[:artist_name],[:track_title]'],
  'compx-load_query': [
    ['request_required', 'search_query$exists'],
    function (one, two) {
      return one && two;
    }
  ],

  'compx-search_complete': [['@one:search_complete:search_query']],
  'compx-search_fail': [['@one:search_fail:search_query']],
  'compx-search_progress': [['@one:search_progress:search_query']],
  'compx-has_request': [['@one:has_request:search_query']],

  'stch-load_query': function (target, state) {
    if (!state) {return;}

    var request = target.getNesting('search_query').requestFiles();
		if (!request) {return;}

		target.addRequest(request);
  }
});

return FilesBySource;
});
