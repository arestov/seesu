define(['pv', 'spv', '../models/SongFileModel'], function(pv, spv, SongFileModel){
"use strict";


var guessArtist = function(track_title_raw, query_artist){
	var track_title = track_title_raw.slice(0, 80);

	var r = {};
	if (!track_title){
		return r;
	}
	var remove_digits = !query_artist || query_artist.search(/^\d+?\s?\S*?\s/) === 0;

	if (remove_digits){
		var matched_spaces = track_title.match(/\s?[\—\-\—\–]\s/gi);
		if (matched_spaces && matched_spaces.length > 1){
			track_title = track_title.replace(/^\d+[\s\.\—\-\—\–\_\|\+\(\)\*\&\!\?\@\,\\\/\❤\♡\'\"\[\]]*\s?/,"");
		}
		///^\d+[\s\.\—\-\—\–\_\|\+\(\)\*\&\!\?\@\,\\\/\❤\♡\'\"\[\]]*\s?/  for "813 - Elastique ( Rinse FM Rip )"

		//01 The Killers - Song - ::remove number
	}

	var title_parts = track_title.split(/\s?[\—\-\—\–]\s/);
	var artist_name_match = track_title.match(/([\s\S]*?)\s?[\—\-\—\–]\s/);
	if (title_parts && title_parts.length > 1){
		if (title_parts[0] == query_artist){
			r.artist = artist_name_match[1];
			r.track = track_title.replace(artist_name_match[0], '');
		} else if (title_parts[title_parts.length-1] == query_artist){
			var end_artist_name_match = track_title.match(/\s?[\—\-\—\–]\s([\s\S]*?)$/);
			if (end_artist_name_match && end_artist_name_match[1]){
				r.artist = end_artist_name_match[1];
				r.track = track_title.replace(end_artist_name_match[0], '');
			}
		}
	}
	if (!r.artist){
		var wordby_match = track_title.match(/by[\s]+?(.+)/);
		if (query_artist && wordby_match && wordby_match[1] && wordby_match[1] == query_artist){
			r.artist = query_artist;
			r.track = track_title.replace(wordby_match[0], '');
		} else if (title_parts && title_parts.length > 1){
			r.artist = artist_name_match[1];
			r.track = track_title.replace(artist_name_match[0], '');
		} else if (query_artist && wordby_match){
			r.artist = query_artist;
			r.track = track_title.replace(wordby_match[0], '');
		}
	}
	return r;
};

var QueryMatchIndex = function() {};

spv.Class.extendTo(QueryMatchIndex, {
	init: function(file, query) {

	},
	match: function(){
		if (!this.trim_index) {
			this.trim_index = {};
		}
		for (var i = 0; i < this.match_order.length; i++) {
			var match_index = this.match_order[i].call(this, this.under_consideration, this.query);
			if (typeof match_index == 'number'){
				if (match_index !== 0){
					while (match_index >= 10){
						match_index = match_index/10;
					}
				}
				this.match_index = i * 10 + match_index * 1;
				break;
			}

		}
		if (typeof this.match_index != 'number'){
			this.match_index = -1;
		}
		this.trim_index = null;
	},
	toQueryString: function(msq) {
		return (msq.artist || '') + (msq.track ?  (' - ' + msq.track) : '');
	},
	valueOf: function(){
		return this.match_index;
	},
	hardTrim: function(string, min_length){
		var trimmed;
		if (!this.trim_index[string]) {

			trimmed = spv.hardTrim(string);
			/*
			trimmed = string.toLowerCase()
				.replace(/^The /, '')
				.replace(/[\.\—\-\—\–\_\|\+\(\)\*\&\!\?\@\,\\\/\❤\♡\'\"\[\]]/gi, '')
				.replace(/(^\s+)|(\s+$)/gi, '')
				.replace(/\s+/gi, ' ');*/
			this.trim_index[string] = trimmed;
		}



		trimmed = this.trim_index[string];


		if (!min_length){
			return trimmed;
		} else {
			if (trimmed.length >= min_length){
				return trimmed;
			} else {
				return string;
			}
		}
	}
});


var SongQueryMatchIndex = function(song_item, query){
	this.trim_index = null;
	this.under_consideration = song_item;
	this.query = query;
	this.query_string = this.toQueryString(this.query);
	this.match_order = [this.matchers.full, this.matchers.almost, this.matchers.anyGood, this.matchers.byWordsInTrackField, this.matchers.byWordsInFullTitle, this.matchers.inDescription];
	this.match();
};

QueryMatchIndex.extendTo(SongQueryMatchIndex, {

	matchers: {
		full: function(file_song, query){
			return (file_song.artist == query.artist && (!query.track || file_song.track == query.track)) && 0;
		},
		almost: function(file_song, query){
			if (query.artist && file_song.artist){
				if (this.hardTrim(query.artist).length >= 3 && (!query.track || this.hardTrim(query.track).length >= 3)){
					return (this.hardTrim(query.artist) == this.hardTrim(file_song.artist) && (!query.track || this.hardTrim(query.track) == this.hardTrim(file_song.track))) && 0;

				}
			}

		},
		anyGood: function(file_song, query){
			var full_title = this.hardTrim(((file_song.artist || "" ) + ' ' + (file_song.track || "" )), 3);

			if (query.q){

				if (full_title.indexOf(this.hardTrim(query.q, 3)) != -1){
					return 0;
				}
			} else {
				var query_artist = this.hardTrim(query.artist, 3);
				var artist_match = file_song.artist && query_artist && this.hardTrim(file_song.artist, 3).indexOf(query_artist) != -1;

				if (!query.track){
					if (artist_match){
						return 0;
					}
				} else {
					var query_track = this.hardTrim(query.track, 3);
					var track_match  = file_song.track && query_track && this.hardTrim(file_song.track, 3).indexOf(query_track) != -1;
					if (artist_match && track_match){
						return 0;
					} else {
						this.artist_in_full_title = query_artist && full_title.indexOf(query_artist) != -1;
						var hard_track_match = file_song.track && query_track && full_title.indexOf(query_track) != -1;
						if (this.artist_in_full_title && hard_track_match){
							return 5;
						}
					}
				}


			}
		},
		byWordsInTrackField: function(file_song, query){
			if (this.artist_in_full_title && query.track){
				var match = spv.matchWords(this.hardTrim(file_song.track, 3), this.hardTrim(query.track, 3));
				if (match.forward){
					return 0;
				} else if (match.any){
					return 5;
				}
			}
		},
		byWordsInFullTitle: function(file_song, query){
			if (this.artist_in_full_title && query.q || query.track){
				var full_title = this.hardTrim(((file_song.artist || "" ) + ' ' + (file_song.track || "" )), 3);
				var full_query =  query.q || ((query.artist || '') + ' - ' + (query.track || ''));
				var match = spv.matchWords(full_title, this.hardTrim(full_query, 3));
				if (match.forward){
					return 0;
				} else if (match.any){
					return 5;
				}
			}
		},
		inDescription: function(file_song, query){
			if (file_song.description){
				if (!query.track){
					return;
				}
				var full_title = this.hardTrim(file_song.description, 3);
				if (!full_title){
					return false;
				}
				var query_artist = this.hardTrim(query.artist, 3);
				var query_track = this.hardTrim(query.track, 3);


				var raw = file_song.description.split(/\n/);
				if (raw.length > 1){
					for (var i = 0; i < raw.length; i++) {
						if (!raw[i] || !raw[i].replace(/\s/gi, '')){
							continue;
						}
						var guess_info  = guessArtist(raw[i], query.artist);
						if (!guess_info.artist){
							continue;
							//guess_info.track = full_title; - why!?!?
						}
						var maindex = new SongQueryMatchIndex(guess_info, query);
						if (maindex != -1){
							return maindex * 1;
						}
					}
				} else {
					var artist_match = file_song.artist && query_artist && full_title.indexOf(query_artist) != -1;
					var track_match = file_song.track && query_track && full_title.indexOf(query_track) != -1;
					if (artist_match && track_match){
						return 9;
					}
				}



			}
		}
	}
});

var pvUpdate = pv.update;
var FilesSourceTuner = spv.inh(pv.Model, {
	init: function(target, opts, data) {
		var search_name = data.search_name;
		target.wch(target.app, 'settings-files_sources', function (e) {
			pvUpdate(this, 'settings', e.value && e.value[search_name]);
		});
		target.updateManyStates(data);
	}

}, {
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
var getQueryString = function(msq) {
	return (msq.artist || '') + (msq.track ?  (' - ' + msq.track) : '');
};

var setFileQMI = function(file, msq, Constr, force_rewrite) {
	var query_string = getQueryString(msq);
	file.query_match_index = file.query_match_index || {};
	if (file.query_match_index[ query_string ] && !force_rewrite) {
		return file.query_match_index[ query_string ];
	}
	file.query_match_index[ query_string.replace(/\./gi, '') ] = Constr ? ( new Constr(file, msq) * 1 ) : ( new SongQueryMatchIndex(file, msq) * 1 );
	return file.query_match_index[ query_string ];
};
var getFileQMI = function(file, msq) {
	var query_string = getQueryString(msq);
	return spv.getTargetField(file, [ 'query_match_index', query_string.replace(/\./gi, '') ]);
};

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
		init: function(target, opts, data, search_eng_name) {
			// this._super.apply(this, arguments);

			target.mp3_search = target.map_parent.map_parent;
			target.search_name = search_eng_name;
			target.search_eng = target.mp3_search.getSearchByName(search_eng_name);

			target.msq = data.msq;
			target.query_string = data.query_string;

			target.updateManyStates({
				'dmca_url': target.search_eng && target.search_eng.dmca_url,
				'search_name': search_eng_name
			});

			target.tuner = target.mp3_search.getSourceTuner(search_eng_name);
			target.wch(target.tuner, 'disable_search', function(e) {
				//debugger;
				pvUpdate(this, 'disable_search', e.value);
			});
			target.wch(target.tuner, 'wait_before_playing');

			//this.wch(this.map_parent, 'must_load');

			//cache
			//network
			//scope
		}
	}, {

		switchTunerVisibility: function() {
			var visible = this.getNesting('vis_tuner');
			pv.updateNesting(this, 'vis_tuner', ( visible ? null : this.tuner ) );
		},
		startSearch: function(opts) {
			opts = opts || {};
			if ((!this.state('search_complete') || this.state('search_fail') ) && !this.state('search_progress')){
				return this.makeRequest(this.msq, {
					only_cache: opts.only_cache,
					nocache: opts.nocache
				});
			}
		},
		addFile: function(file) {
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
						this.mp3_search.sortMusicFilesArray(all, this.msq);
					}


					return !!all.length && all;
				}
			],
			'has_mp3_files': [
				['files-list'],
				function(sarr) {
					if (!sarr) {return;}
					for (var i = 0; i < sarr.length; i++) {
						if (sarr[i].media_type =='mp3'){
							return true;
						}
					}
				}
			],
			'has_best_files': [
				['files-list'],
				function(fslist) {
					if (!fslist) {return;}
					var field_name = 'query_match_index.' + getQueryString(this.msq).replace(/\./gi, '');
					var best_songs = spv.filter(fslist, field_name, function(value){
						if (value !== -1 && value < 20){
							return true;
						}
					});
					return !!best_songs.length;
				}
			],
			'has_files': [
				['files-list'],
				function(fslist) {
					return fslist && !!fslist.length;
				}
			],
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


			var
				_this = this,
				used_successful,
				complex_response = new spv.Depdc(true);

			complex_response.abort = function() {
				if (used_successful){
					used_successful.abort();
				}
			};

			used_successful = this.search_eng.findAudio(msq, {
				nocache: opts.nocache,
				bindRelation: this.map_parent.bindRelation
			})
				.progress(function(){
					pv.update(_this, 'search_progress', true);
				})
				.done(function(music_list){
					if (music_list instanceof Error) {
						_this.updateManyStates({
							search_result: null,
							search_fail: true,

							search_progress: false,
							has_request: false,
							search_complete: true
						});
					} else if (music_list instanceof pv.Model) {
						pv.update(_this, 'search_fail', false);

						_this.wlch(music_list, '@items', 'search_result');

						_this.lwch(music_list, 'query_complete', function(state) {
							if (state) {
								_this.updateManyStates({
									search_complete: true,
									search_progress: false,
									has_request: false
								});
							} else {

							}
						});

					} else {
						_this.updateManyStates({
							search_result: getMatchedSongs(music_list, msq),
							search_fail: false,


							search_progress: false,
							has_request: false,
							search_complete: true
						});
					}


				})
				.fail(function(){
					_this.updateManyStates({
						search_fail: true,

						search_progress: false,
						has_request: false,
						search_complete: true
					});
				});

			var req;
			if (used_successful){
				complex_response.queued = used_successful.queued;
				used_successful.promise( complex_response );
				req = complex_response;
				this.addRequest(complex_response);
			}
			pv.update(this, 'has_request', true);
			return req;

		}
	});

	var isDepend = pv.utils.isDepend;
	var pvState = pv.state;
	var updateNesting = pv.updateNesting;

	var filterList = function(target_list_name, check) {
		return function(target, newst, old, source) {
			var result = [];
			for (var i = 0; i < source.items.length; i++) {
				if ( check( source.items[i] ) ) {
					result.push( source.items[i] );
				}
			}
			updateNesting(target, target_list_name, result);
		};
	};

	var FilesInvestg = spv.inh(pv.Model, {
		init: function(target, opts, data, params) {
			// this._super.apply(this, arguments);
			target.sources = {};
			target.sources_list = [];
			target.checked_files = {};
			target.mp3_search = params.mp3_search;
			target.msq = params.msq;
			target.query_string = params.query_string;

			target.createRelationsBinder();

			//this.on('vip_state_change-search_progress', function(e) {
			//	console.log('search_progress: ' + e.value);
			//}, {immediately: true});

			target.mp3_search.on('list-changed', target.hndListChange, {soft_reg: false, context: target});

			target.wch(target.mp3_search, 'big_files_list', target.hndBigFilesList);

			target.nextTick(function(target) {
				target.startSearch( {only_cache: true} );
			});


		},
	}, {

		'stch-disable_search@sources_list': filterList('available_sources', function(item) {
			return !pvState(item, 'disable_search');
		}),
		'stch-wait_before_playing@sources_list': filterList('expected_sources', function(item) {
			return pvState(item, 'wait_before_playing');
		}),
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
		hndBigFilesList: function(e) {
			var array = e && e.value || [];
			for (var i = 0; i < array.length; i++) {
				this.delayFileCheck(array[i]);
			}

		},
		hndListChange: function(list) {
			var _this = this;
			for (var i = 0; i < list.length; i++) {
				var cur = list[i].name;
				if (!this.sources[cur]){
					this.sources[cur] = this.bindSource(cur, {
						msq: this.msq,
						query_string: this.query_string
					}, this.mp3_search);
					this.sources_list.push(this.sources[cur]);
				}
			}

			this.sources_list.sort(function(g,f){
				return _this.byBestSearchIndex(g, f, _this.mp3_search.searches_pr);
			});

			pv.updateNesting(this, 'sources_list', this.sources_list);

			//_this.trigger('child_change-sources_list', _this.sources_list);
		},
		addFbS: function(search_name) {
			var _this = this;
			if (!this.sources[search_name]){
				this.sources[search_name] = this.bindSource(search_name, {
					msq: this.msq,
					query_string: this.query_string
				}, this.mp3_search);
				this.sources_list.push(_this.sources[search_name]);
				this.sources_list.sort(function(g,f){
					return _this.byBestSearchIndex(g, f, _this.mp3_search.searches_pr);
				});

				pv.updateNesting(this, 'sources_list', this.sources_list);
			}

		},
		bindSource: function(name, data, mp3_search) {
			var files_by_source = this.initSi(FilesBySource, data, name);
			var _this = this;
			files_by_source.on('requests', function(requests) {
				_this.addRequests(requests);
			});

			return files_by_source;
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
		startSearch: function(opts) {
			return;

			var requests = [];
			var sources_list = this.getNesting('available_sources') || [];
			for (var i = 0; i < sources_list.length; i++) {
				var req = sources_list[i].startSearch(opts);
				if (req){
					requests.push(req);
				}
			}
			if (requests.length){
				//this.addRequests(requests);
			}
		},
		byBestSearchIndex: function(g,f, searches_pr){
			if (g && f) {
				var gg = searches_pr[g.search_name];
				var ff = searches_pr[f.search_name];
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











var hasMusicCopy = function (array, entity, from_position){
	var ess = /(^\s*)|(\s*$)/g;
	if (!array.length) {return false;}

	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist.replace(ess, '') == entity.artist.replace(ess, '')) && (array[i].track.replace(ess, '') == entity.track.replace(ess, '')) && (array[i].duration == entity.duration)) {
			return true;
		}
	}
};



var getAverageDurations = function(mu_array, time_limit){
	var r = {};
	var filtr = function(value){
		if (value && value > time_limit){
			return true;
		}
	};
	for (var a in mu_array.qmi_index){
		var durs = spv.filter(spv.filter(mu_array.qmi_index[a], 'duration', filtr), "duration");


		var summ = 0;

		for (var i = 0; i < durs.length; i++) {
			summ += durs[i];
		}
		if (summ){
			r[a] = summ/durs.length;
		}
	}
	return r;
};




	var Mp3Search = window.Mp3Search = function(){};

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
	Mp3Search.setFileQMI = setFileQMI;
	Mp3Search.getFileQMI = getFileQMI;
	Mp3Search.hasMusicCopy = hasMusicCopy;
	Mp3Search.guessArtist = guessArtist;
	Mp3Search.QueryMatchIndex = QueryMatchIndex;

	pv.Model.extendTo(Mp3Search,  {
		init: function(opts, data, searches_pr) {
			this._super.apply(this, arguments);

			// this.app = opts.app;
			this.se_list = [];
			this.searches_pr  = searches_pr || {};
			this.tools_by_name = {};
			pv.update(this, 'tools_by_name', this.tools_by_name);
			this.investgs = {};
			this.investgs_by_artist = {};
			this.files_ids = {};
			this.pushed_files_by_artist = {};
			this.tuners = {};
			this.on('list-changed', function(list) {
				var tools_by_name = {};
				if (list) {
					for (var i = 0; i < list.length; i++) {
						var cur = list[i];
						if (!cur.disabled) {
							tools_by_name[cur.name] = true;
						}
					}
				}
				pv.update(this, 'tools_by_name', tools_by_name);
			});
		},
		'regfr-listchange': {
			event_name: 'list-changed',
			fn: function() {
				if (this.se_list.length){
					return [this.se_list];
				}
			}
		},
		getSourceTuner: function(search_name) {
			if (!this.tuners[search_name]) {
				var tuner = this.initSi(FilesSourceTuner, {search_name: search_name});
				this.tuners[search_name] = tuner;
			}
			return this.tuners[search_name];
		},
		getQueryString: getQueryString,
		sortMusicFilesArray: function(music_list, msq, time_limit) {
			var searches_pr = this.searches_pr;

			var query_string = getQueryString(msq);
			time_limit = time_limit || 30000;

			var field_name = ['query_match_index', query_string.replace(/\./gi, '')];
			music_list.qmi_index = spv.makeIndexByField(music_list, field_name);
			var average_durs = getAverageDurations(music_list, time_limit);
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
		getFilesInvestg: function(msq, motivator) {
			var query_string = msq.q || getQueryString(msq);
			var investg = this.investgs[ query_string ];
			if (!investg){
				investg = this.initSi(FilesInvestg, null, {
						mp3_search: this,
						msq: msq,
						query_string: query_string
					});

				this.investgs[query_string] = investg;

				if (msq.artist){
					var lc_artist = msq.artist.toLowerCase();
					this.investgs_by_artist[lc_artist] = this.investgs_by_artist[lc_artist] || [];
					this.investgs_by_artist[lc_artist].push(investg);
				}
			}
			return investg;
		},
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

		},
		getMasterSlaveSearch: function(filter){
			var o = {
				exist_slave: false,
				exist_alone_master: false,
				exitst_master_of_slave: false
			};
			var i;
			var exist_slave;
			var exist_alone_master;
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
			}

		}

	});

return Mp3Search;
});
