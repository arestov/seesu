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
  "+states": {
    "average_dur": [
      "compx",
      ['@duration:filtered_music_files_matches'],
      getAvg
    ]
  },

  DurationGroup: true,

  'nest_sel-filtered_music_files_matches': {
    from: '^>match_ratings',
    where: {
      '>index_value': ['=', 'index_value']
    }
  }
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
  "+states": {
    "disable_search": [
      "compx",
      ['@one:disable_search:tuner']
    ],

    "wait_before_playing": [
      "compx",
      ['@one:wait_before_playing:tuner']
    ],

    "qmi_key": ["compx", ['msq'], QMIKey],

    "request_required": [
      "compx",
      ['disable_search', '^must_load'],
      function(disabled, must_load) {
        return !disabled && must_load;
      }
    ],

    "has_mp3_files": [
      "compx",
      ['mp3files$exists']
    ],

    "has_best_files": [
      "compx",
      ['best_music_files$exists']
    ],

    "has_files": [
      "compx",
      ['music_files_list$exists']
    ],

    "has_any_data": [
      "compx",
      ['has_files', 'search_complete'],
      function (has_files, search_complete) {
        return !!has_files || !!search_complete;
      }
    ],

    "dmca_url": [
      "compx",
      ['@one:dmca_url:source']
    ],

    "load_query": [
      "compx",
      ['request_required', 'search_query$exists'],
      function (one, two) {
        return one && two;
      }
    ],

    "search_complete": [
      "compx",
      ['@one:search_complete:search_query']
    ],

    "search_fail": [
      "compx",
      ['@one:search_fail:search_query']
    ],

    "search_progress": [
      "compx",
      ['@one:search_progress:search_query']
    ],

    "has_request": [
      "compx",
      ['@one:has_request:search_query']
    ]
  },

  'nest-tuner': ['^^tuners/[:search_name]'],

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

  'nest_conj-music_files_list': ['queried_music_files', 'requested_music_files', 'injected_music_files'],

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

  'nest-source': ['#mp3_search/sources/[:search_name]'],
  'nest-search_query': ['#mp3_search/sources/[:search_name]/queries/[:artist_name],[:track_title]'],

  'stch-load_query': function (target, state) {
    if (!state) {return;}

    var request = target.getNesting('search_query').requestFiles();
    if (!request) {return;}

    target.addRequest(request);
  }
});

return FilesBySource;
});
