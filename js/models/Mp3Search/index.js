define(function(require){
"use strict";
var pv = require('pv');
var spv = require('spv');
var MusicFile = require('./MusicFile');
var SongFileModel = require('../SongFileModel');
var routePathByModels = require('js/libs/BrowseMap').routePathByModels;
var guessArtist = require('./guessArtist');
var pvState = pv.state;
var QMI = require('./QMI');
var getQueryString = QMI.getQueryString;
var QueryMatchIndex = QMI.QueryMatchIndex;
var setFileQMI = QMI.setFileQMI;
var getFileQMI = QMI.getFileQMI;

var pvUpdate = pv.update;
var FilesSourceTuner = spv.inh(pv.Model, {
	init: function(target, opts, data) {
		target.updateManyStates(data);
	}
}, {
	'compx-settings': [
		['search_name', '#settings-files_sources'],
		function (search_name, value) {
			return value && value[search_name];
		}
	],
	'compx-disable_search': [
		['settings'],
		function(settings) {
			return settings && settings['disable_search'];
		}

	],
	'compx-wait_before_playing': [
		['settings'],
		function(settings) {
			return settings && settings['wait_before_playing'];
		}
	],
	changeSetting: function(setting_name, value) {
		var all_settings = this.app.settings['files_sources'];
		all_settings = all_settings ? spv.cloneObj({}, all_settings) : {};
		spv.setTargetField(all_settings, [this.state('search_name'), setting_name], value);
		all_settings[this.state('search_name')] = spv.cloneObj({}, all_settings[this.state('search_name')]);
		this.app.setSetting('files_sources', all_settings);
	},
	changeTune: function(tune_name, value) {
		this.changeSetting(tune_name, value);
	}

});

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
		// 'stch-files-list': function (target, array) {
		// 	target.updateNesting('files-list', array);
		// },
    'nest_cnt-music_files_list': ['requested_music_files', 'injected_music_files'],
    'compx-qmi_key': [['msq'], QMIKey],
		'nest_sel-best_music_files': {
			from: 'match_ratings',
			map: '>^'
		},
    'nest_sel-match_ratings': {
      from: 'music_files_list',
      map: '>match_ratings/[:search_name],[:artist_name],[:track_title]'
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

	var isDepend = pv.utils.isDepend;

	var FilesInvestg = spv.inh(pv.Model, {
		init: function(target, opts, data, params) {
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
		'compx-has_request': [
			['@some:has_request:available_sources']
		],
		'compx-search_progress': [
			['@some:search_progress:available_sources']
		],
		'compx-search_complete': [
			['@every:search_complete:available_sources']
		],
		'compx-has_files':[
			['@some:has_files:available_sources']
		],
		'compx-has_mp3_files': [
			['@some:has_mp3_files:available_sources']
		],
		'compx-has_best_files': [
			['@some:has_best_files:available_sources']
		],
		'compx-exsrc_has_request': [
			['@some:has_request:expected_sources']
		],
		'compx-exsrc_search_complete': [
			['@every:search_complete:expected_sources']
		],
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

function byBestSearchIndex(g,f, searches_pr){
	if (g && f) {
		var gg = searches_pr[pvState(g, 'search_name')];
		var ff = searches_pr[pvState(f, 'search_name')];
		if (typeof gg =='undefined'){
			gg = -1000;
		}
		if (typeof ff =='undefined'){
			ff = -1000;
		}
		if (gg < ff){
			return 1;
		}
		else if (gg > ff){
			return -1;
		}
		else{
			return 0;
		}
	} else {
		return 0;
	}
}

var hasMusicCopy = function (array, entity, from_position){
	var ess = /(^\s*)|(\s*$)/g;
	if (!array.length) {return false;}

	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist.replace(ess, '') == entity.artist.replace(ess, '')) && (array[i].track.replace(ess, '') == entity.track.replace(ess, '')) && (array[i].duration == entity.duration)) {
			return true;
		}
	}
};

function calcSumm(arr) {
  var summ = 0;
  for (var i = 0; i < arr.length; i++) {
    summ += arr[i];
  }
  return summ;
}

function getAvg(arr) {
  if (!arr || !arr.length) {
    return;
  }
  return calcSumm(arr)/arr.length;
}

var getAverageDurations = function(mu_array, time_limit, qmi_index){
	var r = {};
	var filtr = function(value){
		if (value && value > time_limit){
			return true;
		}
	};
	for (var a in qmi_index){
		var durs = spv.filter(spv.filter(qmi_index[a], 'duration', filtr), "duration");
		r[a] = getAvg(durs);
	}
	return r;
};




	var Mp3Search = spv.inh(pv.Model, {
		init: function(target, opts, data, searches_pr) {
			// this._super.apply(this, arguments);

			// this.app = opts.app;
			target.se_list = [];
			target.tools_by_name = {};
			target.api_wrappers = {};
			pvUpdate(target, 'tools_by_name', target.tools_by_name);

			target.investgs = {};
			target.investgs_by_artist = {};
			target.files_ids = {};
			target.pushed_files_by_artist = {};
			target.tuners = {};
			target.on('list-changed', function(list) {
				var tools_by_name = {};
				if (list) {
					for (var i = 0; i < list.length; i++) {
						var cur = list[i];
						if (!cur.disabled) {
							tools_by_name[cur.name] = true;
						}
					}
				}
				pvUpdate(this, 'tools_by_name', tools_by_name);
			});
		}
	},  {
		'compx-searches_pr': [['#mp3_search_order']],
		sub_pager: {
			type: {
				tuners: 'tuner',
				lookups: 'lookup'
			},
			by_type: {
				lookup: [
					FilesInvestg, null, {
						artist_name: 'by_comma.0',
						track_title: 'by_comma.1',
						'msq.artist': 'by_comma.0',
						'msq.track': 'by_comma.1',
					}
				],
				tuner: [
					FilesSourceTuner, null, {
						search_name: 'simple_name'
					}
				],
			}
		},
		getFilesInvestg: function(msq, motivator) {
			return routePathByModels(
				this,
				'lookups/' + this.app.encodeURLPart(msq.artist) + ',' + this.app.encodeURLPart(msq.track),
				false,
				true);
		},
		'regfr-listchange': {
			event_name: 'list-changed',
			fn: function() {
				if (this.se_list.length){
					return this.se_list;
				}
			}
		},
		'chi-music_file': MusicFile,
		'chi-tuner': FilesSourceTuner,
		getSourceTuner: function(search_name) {
			if (!this.tuners[search_name]) {
				var tuner = this.initChi('tuner', {search_name: search_name});
				this.tuners[search_name] = tuner;
			}
			return this.tuners[search_name];
		},
		getQueryString: getQueryString,
		sortMusicFilesArray: function(music_list, msq, time_limit) {
			var searches_pr = pvState(this, 'searches_pr');

			var query_string = getQueryString(msq);
			time_limit = time_limit || 30000;

			var field_name = ['query_match_index', query_string.replace(/\./gi, '')];
			var qmi_index = spv.makeIndexByField(music_list, field_name);
			var average_durs = getAverageDurations(music_list, time_limit, qmi_index);
			music_list.sort(function(a, b){
				return spv.sortByRules(a, b, [
					function(item) {
						var value = spv.getTargetField(item, field_name);
						if (value === -1){
							return Infinity;
						} else {
							return value;
						}
					},
					{
						field: function(item) {
							if (item.from && searches_pr.hasOwnProperty(item.from) ) {
								return searches_pr[item.from];
							} else {
								return -1000;
							}
						},
						reverse: true
					},
					function(item){

						var average_dur = average_durs[spv.getTargetField(item, field_name)];
						if (average_dur){
							if (item.duration && item.duration > time_limit){
								return Math.abs(average_dur - item.duration);
							} else {
								return average_dur * 1000;
							}
						} else {
							return Infinity;
						}
					}
				]);
			});

		},
		getFileQMI: getFileQMI,
		setFileQMI: setFileQMI,
		/*
		getCache: function(sem, name){
			return cache_ajax.get(name + 'mp3', sem.q, function(r){

				sem.addSteamPart(r.search_source, r.music_list, r.type);
				sem.change();

			});
		},*/
		newSearchInit: function(filter, search){
			this.tools_by_name[filter] = search;


			this.trigger('list-changed', this.se_list);
			this.trigger('new-search', search, filter);


			var wrapper = this.initChi('api_wrapper', null, null, null, {search_name: filter});
			var core_list = this.getNesting('sources_core_list') || [];
			core_list.push(wrapper);
			this.updateNesting('sources_core_list', core_list);

		},
		'nest_sel-sources_sorted_list': {
			from: 'sources_core_list',
			sort: [
				['>search_name', 'searches_pr'],
				function (one, two, base) {
					return byBestSearchIndex(one, two, pvState(base, 'searches_pr'));
				}
			]
		},
		'chi-api_wrapper': pv.Model,
		getMasterSlaveSearch: function(filter){
			var o = {
				exist_slave: false,
				exist_alone_master: false,
				exitst_master_of_slave: false
			};
			var i;
			for (i=0; i < this.se_list.length; i++) {
				var cmp3s = this.se_list[i];
				if (!cmp3s.disabled && cmp3s.name == filter){
					if (cmp3s.slave){
						if (!o.exist_slave){
							o.exist_slave = cmp3s;
							break;
						}
					}
				}
			}
			for (i=0; i < this.se_list.length; i++) {
				var cmp3s = this.se_list[i];
				if (!cmp3s.disabled && cmp3s.name == filter){
					if (!cmp3s.slave){
						if (o.exist_slave){
							if (o.exist_slave.preferred == cmp3s){
								o.exitst_master_of_slave = cmp3s;
							} else{
								o.exist_alone_master = cmp3s;
							}
						} else{
							o.exist_alone_master = cmp3s;
						}
					}
				}
			}
			return o;
		},
		addFileToInvestg: function(file, msq) {
			var qmi = this.setFileQMI(file, msq);
			if (qmi != -1) {
				var investg = this.getFilesInvestg(msq);
				investg.addFile(file, file.from);
			}



		},
		pushSomeResults: function(music_list) {
			var allowed_files = [];
			for (var i = 0; i < music_list.length; i++) {
				var cur = music_list[i];
				var file_id = cur.from + '_' + (cur._id || cur.link);
				if (!this.files_ids[file_id]){
					this.files_ids[file_id] = true;
					allowed_files.push(cur);
				}

			}
			var original_array = this.state('big_files_list ') || [];
			original_array = original_array.concat(allowed_files);
			pv.update(this, 'big_files_list ', original_array);
		},
		haveSearch: function(search_name){
			var o = this.getMasterSlaveSearch(search_name);
			return !!o.exist_slave || !!o.exitst_master_of_slave || !!o.exist_alone_master;
		},
		isNoMasterOfSlave: function(filter){
			var o = this.getMasterSlaveSearch(filter);
			return !!o.exist_slave && !o.exitst_master_of_slave;
		},

		addSearch: function(space, msearch){
			this.spaces = this.spaces || {};
			var spaces = this.spaces;

			spaces[space] = msearch;
		},
		getSearchByName: function(tool_name) {
			return this.tools_by_name[tool_name];
		},
		add: function(asearch, force){
			var o = this.getMasterSlaveSearch(asearch.name);
			if (o.exist_slave){
				if (force || !o.exitst_master_of_slave){
					if (o.exist_slave.preferred){
						o.exist_slave.preferred.disabled = true;
					}
					this.se_list.push(asearch);
					o.exist_slave.preferred = asearch;
					this.newSearchInit(asearch.name, asearch);
				}
			} else if (o.exist_alone_master){
				if (force){
					o.exist_alone_master.disabled = true;
					this.se_list.push(asearch);
					this.newSearchInit(asearch.name, asearch);
				}
			} else{
				this.se_list.push(asearch);
				this.newSearchInit(asearch.name, asearch);
			}
		},
		remove: function(msearch) {
			var se_list = this.se_list;
			this.se_list = spv.arrayExclude(this.se_list, msearch);
			if (se_list.length != this.se_list){
				this.trigger('list-changed', this.se_list);
				this.updateNesting('sources_core_list', this.se_list);
			}

		}

	});

	Mp3Search.getSongFileModel = function(map_parent){
		return map_parent.initSi(SongFileModel, null, {file:this});
	};
	Mp3Search.getSFM = function(map_parent, file) {
		if (file.getSongFileModel) {
			return file.getSongFileModel(map_parent);
		} else {
			return map_parent.initSi(SongFileModel, null, {file: file});
		}

	};
  function QMIKey(msq) {
    if (!msq) {return;}
    return getQueryString(msq).replace(/\./gi, '');
  }
	Mp3Search.setFileQMI = setFileQMI;
	Mp3Search.getFileQMI = getFileQMI;
	Mp3Search.hasMusicCopy = hasMusicCopy;
	Mp3Search.guessArtist = guessArtist;
	Mp3Search.QueryMatchIndex = QueryMatchIndex;

return Mp3Search;
});
