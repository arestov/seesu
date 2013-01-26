var getSongFileModel = function(mo, player){
	return this.models[mo.uid] = this.models[mo.uid] || (new songFileModel()).init({file: this, mo: mo}).setPlayer(player);
};

var FilesInvestg;
(function(){
	var FilesSourceStorage = function() {};
	provoda.Model.extendTo(FilesSourceStorage, {
		init: function(opts, params) {

		}
	});

	var FilesBySource = function() {};
	provoda.Model.extendTo(FilesBySource, {
		init: function(opts, params, search_eng_name) {
			this._super();
			this.mp3_search = opts.mp3_search;
			this.search_name = search_eng_name;
			this.search_eng = this.mp3_search.getSearchByName(search_eng_name);

			this.msq = params.msq;
			this.query_string = params.query_string;

			//cache
			//network
			//scope
		},
		startSearch: function(opts) {
			if (!this.state('search-complete') && !this.state('search-progress')){
				this.makeRequest(this.msq, {
					only_cache: opts.only_cache,
					nocache: opts.nocache
				});
			}
		},
		getFiles: function(type) {
			var res = this.state('search-result');
			if (res && res.type == type){
				return res.items || [];
			} else {
				return [];
			}
		},
		complex_states: {
			'files-list': {
				depends_on: ['search-result'],
				fn: function(sr) {
					return sr && sr.items;
				}
			},
			'has-mp3-files': {
				depends_on: ['search-result'],
				fn: function(sr) {
					if (sr.type == 'mp3'){
						return !!sr.items.length;
					}
				}
			},
			'has-best-files': {
				depends_on: ['files-list'],
				fn: function(fslist) {
					var best_songs = $filter(fslist, 'query_match_index', function(value){
						if (value < 20){
							return true;
						}
					});
					return !!best_songs.length;
				}
			},
			'has-files': {
				depends_on: ['files-list'],
				fn: function(fslist) {
					return !!fslist.length;
				}
			}
		},
		makeRequest: function(msq, opts) {
			if (opts.only_cache || this.state('has-request')){
				return;
			}
			

			var
				_this = this,
				used_successful,
				complex_response = new depdc(true);

			complex_response.abort = function() {
				if (used_successful){
					used_successful.abort();
				}
			};

			used_successful = this.search_eng.findAudio(msq, {
				nocache: opts.nocache
			})
				.progress(function(note){
					if (note == 'just-requested'){
						
					}
					_this.updateState('search-progress', true);
				})
				.done(function(music_list, type){
					_this.updateState('search-result', {
						items: music_list,
						type: type
					});
					_this.updateState('search-complete', true);
					_this.updateState('search-fail', false);
				})
				.fail(function(){
					
					_this.updateState('search-fail', true);
				})
				.always(function() {
					_this.updateState('search-progress', false);
					_this.updateState('has-request', false);
				});


			if (used_successful){
				complex_response.queued = used_successful.queued;
				used_successful.promise( complex_response );
				this.addRequest(complex_response);
			}
			this.updateState('has-request', true);


		}
	});

	FilesInvestg = function() {};
	provoda.Model.extendTo(FilesInvestg, {
		init: function(opts, params) {
			this._super();
			this.sources = {};
			this.sources_list = [];
			this.mp3_search = opts.mp3_search;
			this.msq = params.msq;
			this.query_string = params.query_string;
			var _this = this;

			this.archivateChildrenStates('sources_list', 'has-request');
			this.archivateChildrenStates('sources_list', 'search-progress');
			this.archivateChildrenStates('sources_list', 'search-complete', 'every');
			
			this.archivateChildrenStates('sources_list', 'has-files');
			this.archivateChildrenStates('sources_list', 'has-mp3-files');
			this.archivateChildrenStates('sources_list', 'has-best-files');



			//this.on('state-change.search-progress', function(e) {
			//	console.log('search-progress: ' + e.value);
			//});
			
			this.mp3_search.on('list-changed', function(list) {
				for (var i = 0; i < list.length; i++) {
					var cur = list[i].name;
					if (!_this.sources[cur]){
						_this.sources[cur] = _this.bindSource(cur, params, this);
						_this.sources_list.push(_this.sources[cur]);
					}
				}

				_this.sources_list.sort(function(g,f){
					return _this.byBestSearchIndex(g, f, _this.mp3_search.searches_pr);
				});

				_this.setChild('sources_list', _this.sources_list);

				//_this.trigger('child-change.sources_list', _this.sources_list);
			});
			
		},
		bindSource: function(name, params, mp3_search) {
			var files_by_source = new FilesBySource();
			files_by_source.init({
				mp3_search: mp3_search
			}, params, name);
			var _this = this;
			files_by_source.on('request', function(rq) {
				_this.addRequest(rq);
			});
			return files_by_source;
		},
		complex_states: {
			'legacy-files-search': {
				depends_on: ['has-best-files', 'has-files', 'has-mp3-files', 'search-complete'],
				fn: function(h_best_f, h_files, h_mp3_files, s_complete) {
					return {
						search_complete: s_complete,
						have_best_tracks: h_best_f,
						have_tracks: h_files,
						have_mp3_tracks: h_mp3_files
					};
				}
			},
			'search-ready-to-use': {
				depends_on: ['has-best-files', 'search-complete'],
				fn: function(h_best_f, s_complete) {
					return h_best_f || s_complete;
				}
			}
		},
		startSearch: function(opts) {
			for (var i = 0; i < this.sources_list.length; i++) {
				this.sources_list[i].startSearch(opts || {});
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
		}
	});
	

	


})();





var has_music_copy = function (array, entity, from_position){
	var ess = /(^\s*)|(\s*$)/g;
	if (!array.length) {return false;}
	
	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist.replace(ess, '') == entity.artist.replace(ess, '')) && (array[i].track.replace(ess, '') == entity.track.replace(ess, '')) && (array[i].duration == entity.duration)) {
			return true;
		}
	}
};


var guessArtist = function(track_title, query_artist){
	var r = {};
	var remove_digits = !query_artist || query_artist.search(/^\d+?\s?\S*?\s/) === 0;
	if (remove_digits){
		track_title = track_title.replace(/^\d+?[\s\.\—\-\—\–\_\|\+\(\)\*\&\!\?\@\,\\\/\❤\♡\'\"\[\]]*?\s/,"");
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
Class.extendTo(QueryMatchIndex, {
	init: function(file, query) {},
	match: function(){
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
	},
	valueOf: function(){
		return this.match_index;
	},
	hardTrim: function(string, min_length){
		var trimmed = string.toLowerCase().replace(/^The /, '').replace(/[\.\—\-\—\–\_\|\+\(\)\*\&\!\?\@\,\\\/\❤\♡\'\"\[\]]/gi, '').replace(/\s+/gi, ' ');
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
var FileNameSQMatchIndex = function(filename, query) {
	this.init(filename, query);
};
QueryMatchIndex.extendTo(FileNameSQMatchIndex, {
	init: function(filename, query) {
		this.filename = filename;

		this.under_consideration = filename;
		filename.split(/\//);
		this.query = query;
		this.match_order = [];
		this.match();
		return this;
	},
	matchers: {
		best_match: function(filename, query) {

		},
		anyGood: function(filename, query) {

		}
	}
});

var SongQueryMatchIndex = function(song_item, query){
	this.init(song_item, query);
};

QueryMatchIndex.extendTo(SongQueryMatchIndex, {
	init: function(file_song, query){
		this.under_consideration = file_song;
		this.query = query;
		this.match_order = [this.matchers.full, this.matchers.almost, this.matchers.anyGood, this.matchers.byWordsInTrackField, this.matchers.byWordsInFullTitle, this.matchers.inDescription];
		this.match();
		return this;
	},
	
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
				var match = matchWords(this.hardTrim(file_song.track, 3), this.hardTrim(query.track, 3));
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
				var match = matchWords(full_title, this.hardTrim(full_query, 3));
				if (match.forward){
					return 0;
				} else if (match.any){
					return 5;
				}
			}
		},
		inDescription: function(file_song, query){
			if (file_song.description){
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

var getAverageDurations = function(mu_array, time_limit){
	var r = {};
	for (var a in mu_array.qmi_index){
		var durs = $filter($filter(mu_array.qmi_index[a], 'duration', function(value){
			if (value && value > time_limit){
				return true;
			}
		}), "duration");

		
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

var sortMusicFilesArray= function(music_list, time_limit){
	time_limit = time_limit || 30000;
	music_list.qmi_index = makeIndexByField(music_list, "query_match_index");
	music_list.average_durs = getAverageDurations(music_list, time_limit);
	music_list.sort(function(a, b){
		return sortByRules(a, b, ["query_match_index", function(item){
			var average_dur = music_list.average_durs[item.query_match_index];
			if (item.duration && item.duration > time_limit){
				return Math.abs(average_dur - item.duration);
				
			} else {
				return average_dur * 1000;
			}
		}]);
	});
};


(function() {

	mp3Search = function(searches_pr){
		this.init();
		this.se_list = [];
		this.searches_pr  = searches_pr || {};
		this.tools_by_name = {};
		this.investgs = {};
		this.onRegistration('list-changed', function(cb) {
			if (this.se_list.length){
				cb(this.se_list);
			}
		});
	};

	provoda.Eventor.extendTo(mp3Search,  {
		getQueryString: function(msq) {
			return (msq.artist || '') + (msq.track ?  (' - ' + msq.track) : '');
		},
		getFilesInvestg: function(msq) {
			var query_string = msq.q || this.getQueryString(msq);
			var investg = this.investgs[query_string];
			if (!investg){
				investg = new FilesInvestg();
				investg.init({
					mp3_search: this
				}, {
					msq: msq,
					query_string: query_string
				});
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
			var exist_slave;
			var exist_alone_master;
			for (var i=0; i < this.se_list.length; i++) {
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
			for (var i=0; i < this.se_list.length; i++) {
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
			var push_later;
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
			this.se_list = arrayExclude(this.se_list, msearch);
			if (se_list.length != this.se_list){
				this.trigger('list-changed', this.se_list);
			}
			
		}

	});
})();

