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
    // this._super.apply(this, arguments);
    target.sources = {};
    target.sources_list = [];
    target.checked_files = {};
    target.mp3_search = target.map_parent;

    // target.query_string = params.query_string;

    target.createRelationsBinder();

    //this.on('vip_state_change-search_progress', function(e) {
    //	console.log('search_progress: ' + e.value);
    //}, {immediately: true});

    target.lwch(target.map_parent, 'big_files_list', target.hndBigFilesList);

    target.nextTick(function(target) {
      target.startSearch( {only_cache: true} );
    });

    target.head = target.head || {};
    target.msq = target.head.msq;
  },
}, {
  'compx-query_string': [['msq'], function (msq) {
    return msq && getQueryString(msq);
  }],
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
  'compx-has_request': [['@some:has_request:available_sources']],
  'compx-search_progress': [['@some:search_progress:available_sources']],
  'compx-search_complete': [['@every:search_complete:available_sources']],
  'compx-has_files':[['@some:has_files:available_sources']],
  'compx-has_mp3_files': [['@some:has_mp3_files:available_sources']],
  'compx-has_best_files': [['@some:has_best_files:available_sources']],
  'compx-exsrc_has_request': [['@some:has_request:expected_sources']],
  'compx-exsrc_search_complete': [['@every:search_complete:expected_sources']],
  'compx-must_load': [
    ['investg_to_load-for-song_need'],
    function(state) {
      return isDepend(state);
    }
  ],
  'stch-must_load': function(target, state) {
    if (state) {
      target.startSearch();
    }
  },
  createRelationsBinder: function() {
    var _this = this;
    this.bindRelation = function(callback) {
      _this.wch(_this, 'must_load', callback);
    };
  },
  hndBigFilesList: function(value) {
    var array = value || [];
    for (var i = 0; i < array.length; i++) {
      this.delayFileCheck(array[i]);
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
  'compx-searches_pr': [['^searches_pr']],
  'nest_sel-sources_list_mapped': {
    from: '^>sources_sorted_list',
    map: '[:search_name]'
  },
  'nest_cnt-sources_list': ['sources_list_mapped', 'sources_list_more'],
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
  complex_states: {
    'exsrc_incomplete': [
      ['exsrc_has_request', 'exsrc_search_complete'],
      function(exsrc_has_request, exsrc_search_complete) {
        return exsrc_has_request && !exsrc_search_complete;
      }
    ],


    'legacy-files-search': [
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
    'search_ready_to_use': [
      ['has_best_files', 'search_complete'],
      function(h_best_f, s_complete) {
        return h_best_f || s_complete;
      }
    ]
  },
  startSearch: function() {
    return;
  },
  delayFileCheck: function(file) {
    if (file.artist == this.msq.artist){
      this.nextTick(function(target) {
        target.checkFile(file);
      });
    }
  },
  checkFile: function(file) {
    var search_name = file.from;
    var file_id = file._id || file.link;
    var checked = spv.getTargetField(this.checked_files, [search_name , file_id]);
    if (!checked){
      this.checked_files[search_name] = this.checked_files[search_name] || {};
      this.checked_files[search_name][file_id] = true;
      var qmi = this.mp3_search.setFileQMI(file, this.msq);

      if (qmi !== -1 && qmi < 20){
        this.addFile(file, search_name);
      }

    }
  },
  addFile: function(file, search_name) {
    this.addFbS(search_name);
    this.sources[search_name].addFile(file);
  }
});

return FilesInvestg;
});
