define(function (require) {
'use strict';
var pv = require('pv');
var pvState = pv.state;
var isDepend = pv.utils.isDepend;
var spv = require('spv');
var compareArray = spv.compareArray;
var routePathByModels = require('js/libs/BrowseMap').routePathByModels;
var FilesBySource = require('./FilesBySource');

var QMI = require('./QMI');
var getQueryString = QMI.getQueryString;

var FilesInvestg = spv.inh(pv.Model, {
  init: function(target) {
    target.sources = {};
  },
}, {
  "+states": {
    "query_string": [
      "compx",
      ['msq'],
      function (msq) {
        return msq && getQueryString(msq);
      }
    ],

    "has_request": [
      "compx",
      ['@some:has_request:available_sources']
    ],

    "search_progress": [
      "compx",
      ['@some:search_progress:available_sources']
    ],

    "search_complete": [
      "compx",
      ['@every:search_complete:available_sources']
    ],

    "has_files": [
      "compx",
      ['@some:has_files:available_sources']
    ],

    "has_mp3_files": [
      "compx",
      ['@some:has_mp3_files:available_sources']
    ],

    "has_best_files": [
      "compx",
      ['@some:has_best_files:available_sources']
    ],

    "exsrc_has_request": [
      "compx",
      ['@some:has_request:expected_sources']
    ],

    "exsrc_search_complete": [
      "compx",
      ['@every:search_complete:expected_sources']
    ],

    "must_load": [
      "compx",
      ['investg_to_load-for-song_need'],
      function(state) {
        return isDepend(state);
      }
    ],

    "searches_pr": ["compx", ['^searches_pr']],

    "exsrc_incomplete": [
      "compx",
      ['exsrc_has_request', 'exsrc_search_complete'],
      function(exsrc_has_request, exsrc_search_complete) {
        return exsrc_has_request && !exsrc_search_complete;
      }
    ],

    "legacy-files-search": [
      "compx",
      ['has_best_files', 'has_files', 'has_mp3_files', 'search_complete', 'exsrc_incomplete'],
      function(h_best_f, h_files, h_mp3_files, s_complete, exsrc_incomplete) {
        return {
          have_best_tracks: h_best_f,
          have_tracks: h_files,
          have_mp3_tracks: h_mp3_files,
          exsrc_incomplete: exsrc_incomplete,
          search_complete: s_complete
        };
      }
    ],

    "search_ready_to_use": [
      "compx",
      ['has_best_files', 'search_complete'],
      function(h_best_f, s_complete) {
        return h_best_f || s_complete;
      }
    ]
  },

  'nest_sel-all_music_files': {
    from: 'sources_list.match_ratings_raw',
    sort: [
      ['matched_order'],
      function (one, two) {
        var value_one = pvState(one, 'matched_order');
        var value_two = pvState(two, 'matched_order');
        return compareArray(value_one, value_two);
      }
    ],
    map: '>^'
  },

  'nest_sel-mp3files_all': {
    from: 'all_music_files',
    where: {'>media_type': ['=', ['mp3']]},
  },

  'nest_sel-able_to_play_mp3files_all': {
    from: 'mp3files_all',
    where: {
      '>unavailable': [['=', 'boolean'], [false]]
    }
  },

  'nest_sel-available_sources': {
    from: 'sources_list',
    where: {
      '>disable_search': [['=', 'boolean'], [false]]
    }
  },

  'nest_sel-expected_sources': {
    from: 'sources_list',
    where: {
      '>wait_before_playing': [['=', 'boolean'], [true]]
    }
  },

  sub_pager: {
    item: [
      FilesBySource,
      [[]],
      {
        search_name: 'decoded_name'
      }
    ]
  },

  'nest_sel-sources_list_mapped': {
    from: '^>sources_sorted_list',
    map: '[:search_name]'
  },

  'nest_conj-sources_list': ['sources_list_mapped', 'sources_list_more'],

  addFbS: function(search_name) {
    if (!this.sources[search_name]){
      this.sources[search_name] = this.bindSource(search_name);

      var list = this.getNesting('sources_list_more') || [];
      list.push(this.sources[search_name]);

      pv.updateNesting(this, 'sources_list_more', list);
    }
  },

  'chi-files_by_source': FilesBySource,

  bindSource: function(name) {
    return routePathByModels(this, name, false, true);
  },

  addFile: function(music_file, search_name) {
    this.addFbS(search_name);
    this.sources[search_name].addFile(music_file);
  }
});

return FilesInvestg;
});
