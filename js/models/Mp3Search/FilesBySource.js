define(function (require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var compareArray = spv.compareArray;
var pvState = pv.state;
var QMI = require('./QMI');
var setFileQMI = QMI.setFileQMI;
var getQueryString = QMI.getQueryString;
var getAvg = require('./sortMusicFilesArray').getAvg;

var getMatchedSongs = function(music_list, msq) {

	var result = [];
	if (!music_list) {
		return result;
	}

	for (var i = 0; i < music_list.length; i++) {
		var cur = music_list[i];
		var qmi = setFileQMI(cur, msq);

		if (qmi != -1){
			result.push(cur);
		}
	}
	return result;
};

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
  init: function(target, opts, data) {
    // this._super.apply(this, arguments);
    var search_eng_name = data.head.search_name;
    target.mp3_search = target.map_parent.map_parent;
    target.search_name = search_eng_name;
    target.search_eng = target.mp3_search.getSearchByName(search_eng_name);

    target.query_string = pvState(target.map_parent, 'query_string');

    target.updateManyStates({
      'dmca_url': target.search_eng && target.search_eng.dmca_url,
      'search_name': search_eng_name
    });

    target.on('requests', function(requests) {
      this.map_parent.addRequests(requests);
    });
    target.msq = target.head.msq;

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
  startSearch: function(opts) {
    opts = opts || {};
    if ((!this.state('search_complete') || this.state('search_fail') ) && !this.state('search_progress')){
      return this.makeRequest(pvState(this, 'msq'), {
        only_cache: opts.only_cache,
        nocache: opts.nocache
      });
    }
  },
  addFile: function(file) {
    var injected_music_files = this.getNesting('injected_music_files') || [];
    var music_file = this.mp3_search.initChi('music_file', null, null, null, file);
    this.updateNesting('injected_music_files', injected_music_files.concat([music_file]));

    var new_array = [];

    var inj_arr = this.state('injected_files') || [];
    new_array = new_array.concat(inj_arr);
    new_array.push(file);
    pv.update(this, 'injected_files', new_array);

  },
  getFiles: function(type) {

    var array = this.state('files-list');
    if (array && array.length){
      if (type){
        return spv.filter(array, 'media_type', type);
      } else {
        return array;
      }
    } else {
      return [];
    }
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
  // 'stch-files-list': function (target, array) {
  // 	target.updateNesting('files-list', array);
  // },
  'nest_cnt-music_files_list': ['requested_music_files', 'injected_music_files'],
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
    from: 'music_files_list',
    where: {
      '>media_type': ['=', ['mp3']]
    }
  },
  complex_states: {
    'request_required': [
      ['disable_search', '^must_load'],
      function(disabled, must_load) {
        return !disabled && must_load;
      }
    ],
    'files-list': [
      ['search_result', 'injected_files'],
      function(sarr, inj_f) {
        var all = [];
        if (sarr && sarr.length){
          all = all.concat(sarr);
        }

        if (inj_f && inj_f.length){
          all = all.concat(inj_f);
        }

        if (all.length) {
          this.mp3_search.sortMusicFilesArray(all, pvState(this, 'msq'));
        }

        return !!all.length && all;
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
  'stch-request_required': function(target, state) {
    if (state) {
      target.startSearch();
    }
  },
  makeRequest: function(msq, opts) {
    if (!this.search_eng || opts.only_cache || this.state('has_request')){
      return;
    }


    var _this = this;
    var used_successful;

    used_successful = this.search_eng.findAudio(msq, {
      nocache: opts.nocache,
      bindRelation: this.map_parent.bindRelation
    });

    used_successful.queued_promise.then(function(){
      pv.update(_this, 'search_progress', true);
    });

    used_successful.then(function(music_list){
        if (music_list instanceof Error) {
          _this.updateManyStates({
            search_result: null,
            search_fail: true,

            search_progress: false,
            has_request: false,
            search_complete: true
          });
        } else if (music_list instanceof pv.Model) {
          throw new Error('broken!');
          // pv.update(_this, 'search_fail', false);
          //
          // _this.wlch(music_list, '@items', 'search_result');
          //
          // _this.lwch(music_list, 'query_complete', function(state) {
          // 	if (!state) {
          // 		return;
          // 	}
          // 	_this.updateManyStates({
          // 		search_complete: true,
          // 		search_progress: false,
          // 		has_request: false
          // 	});
          // });

        } else {
          var matched = getMatchedSongs(music_list, msq);
          var list = new Array(matched.length);
          for (var i = 0; i < matched.length; i++) {
            list[i] = _this.mp3_search.initChi('music_file', null, null, null, matched[i]);
          }
          _this.updateNesting('requested_music_files', list);

          _this.updateManyStates({
            search_result: matched,
            search_fail: false,

            search_progress: false,
            has_request: false,
            search_complete: true
          });
        }


      }, function(){
        _this.updateManyStates({
          search_fail: true,

          search_progress: false,
          has_request: false,
          search_complete: true
        });
      });

    var req;
    if (used_successful){
      req = used_successful;
      this.addRequest(req);
    }
    pv.update(this, 'has_request', true);
    return req;

  }
});

return FilesBySource;
});
