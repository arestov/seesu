var searches_pr = {
	vk: 0,
	lastfm:-10,
	soundcloud: -5
};
var song_methods = {
	getFullName: function(){
		var n = (this.artist || "") + ((this.artist && this.track) ?  ' - ' + this.track :  (this.track || ""))
		return n || 'no title'
	},
	view: function(no_navi){
		su.mp3_search.find_mp3(this);
		viewSong(this, no_navi);	
	},
	wheneWasChanged: function(){
		return (this.raw() && 1) || (this.sem && this.sem.changed || 1);
	},
	makeSongPlayalbe: function(full_allowing,  from_collection, last_in_collection){
		if (this.raw()){
			this.ui.update();
		} else if (!this.track){
			start_random_nice_track_search(this, !full_allowing, from_collection, last_in_collection);
		} else{
			if (this.isSearchCompleted()){
				handle_song(this, true)
			}
			su.mp3_search.find_mp3(this, {
				only_cache: !full_allowing && !this.want_to_play,
				collect_for: from_collection,
				last_in_collection: last_in_collection
			});
		}
	},
	render: function(from_collection, last_in_collection, complex){
		
		var pl = this.plst_titl;
		this.playable_info = {
			packsearch: from_collection,
			last_in_collection: last_in_collection
		};
		if (pl && pl.ui && pl.ui.tracks_container){
			
			if (!this.ui || !this.ui.mainc || this.ui.mainc[0].ownerDocument != su.ui.d){			
				this.ui = new songUI(this, complex);
				var pl_ui_element = this.ui.mainc;
				if (pl.first_song){
					if (!pl.firstsong_inseting_done){
						if (this == pl.first_song.mo){
							pl.ui.tracks_container.append(pl_ui_element);
						} else{
							pl.first_song.mo.ui.mainc.before(pl_ui_element);
						}
					} else if (pl.first_song.mo != this){
						var f_position = pl.indexOf(pl.first_song.mo);
						var t_position = pl.indexOf(this);
						if (t_position < f_position){
							pl.first_song.mo.ui.mainc.before(pl_ui_element);
							
						} else{
							pl.ui.tracks_container.append(pl_ui_element);
						}
					} else{
						pl.ui.tracks_container.append(pl_ui_element);
					}
					
					
				} else{
					pl.ui.tracks_container.append(pl_ui_element);
				}
				
			}
			
		}
		
			
	
	
	},
	song: function(){
		if (this.raw()){
			return this.omo;
		} else if (this.sem) {
			var s = this.sem.getAllSongTracks();
			return !!s && s[0].t[0];
		} else{
			return false;
		}
	},
	songs: function(){
		if (this.raw()){
			return [{t:[this.omo]}];
		} else if (this.sem){
			return this.sem.getAllSongTracks();
		} else{
			return false;
		}
		
	},
	mp3Downloads: function(){
		var songs = this.songs();
		var d = [];
		for (var i=0; i < songs.length; i++) {
			var s = $filter(songs[i].t, 'downloadable', true);
			d = d.concat.apply(d, s);
		};
		return d.length && d;
		
		
		
	},
	getURLPart: function(mopla){
		var url ="";
		if (!this.plst_titl || this.plst_titl.playlist_type =='tracks'){
			if (this.raw()){
				var s = mopla || this.omo;
				url += "/" + s.from + '/' + s._id;
			}
		}
		
		if (this.plst_titl && this.plst_titl.playlist_type == 'artist'){
			if (this.track){
				url += '/' + '_/'+ this.track;
			}
		} else if (this.artist){
			url += '/' + this.artist + '/' + (this.track || '_');
		}
		
		
		return url;
	},
	isHaveAnyResultsFrom: function(source_name){
		return !!this.raw() || !!this.sem && this.sem.isHaveAnyResultsFrom(source_name);
	},
	isNeedsAuth: function(service_name){
		return !this.raw() && (su.mp3_search.isNoMasterOfSlave(service_name) || !su.mp3_search.haveSearch(service_name));
	},
	isHaveTracks: function(){
		return !!this.raw() || !!this.sem && this.sem.have_tracks ;
	},
	isSearchCompleted: function(){
		return !!this.raw() || !!this.sem && this.sem.search_completed;
	},
	isHaveBestTracks: function(){
		return !!this.raw() || !!this.sem && this.sem.have_best;
	},
	kill: function(){
		if (this.ui){
			this.ui.remove();
			delete this.ui;
		}
		
	},
	raw: function(){
		return this.omo && this.omo.raw;
	},
	valueOf:function(){
		return (this.artist ? this.artist + ' - ' : '') + this.track;
	}
};

(function(){
	var counter = 0;
	
	song = function(omo){
		this.uid = ++counter;
		cloneObj(this, omo, false, ['artist', 'track']);
		this.omo = omo;
	};
	
	song.prototype = song_methods;
})();




var extendSong = function(omo){
	if (!(omo instanceof song)){
		return new song(omo);
	} else{
		return omo;
	}
	
	
};


function musicSeachEmitter(q, query){
	this.q = q;
	this.query = query;
	this.fdefs = [];
	this.songs = [];
	
};
musicSeachEmitter.prototype = {
	getSteamsData: function(){
		
		var steams = this.steams;
		if (!steams){
			return false;
		}
		var allr = [];
		
		for (var steam in steams){
			var d = this.getSteamData(steam);
			if (d){
				allr.push(d);
			}
		}
		return !!allr.length && allr;
	},
	getSteamData: function(steam_name){
		if (!this.steams){
			return false;
		}
		var steam = this.steams[steam_name];
		if (!steam){
			return false;
		}
		var nice_steam;
		for(var source in steam){
			if (!steam[source].failed && steam[source].t){
				nice_steam = steam[source];
				break;
			}
		}
		var ugly_steam;
		if (!nice_steam){
			for(var source in steam){
				if (steam[source].failed){
					ugly_steam = steam[source];
					break;
				}
			}
		}
		return nice_steam || ugly_steam || false;
	},
	addSteamPart: function(search_source, t ){
		
		var _ms = this.getMusicStore(search_source);
		this.changed = _ms.changed = (+new Date() > this.changed ? +new Date() : +new Date() + 10);
		
		_ms.t = t;
		
		this.have_tracks = true;
		_ms.processing = false;
		this.some_results = true;
		_ms.failed = false;
		var searches_indexes=[];
		for (var s in searches_pr) {
			if (searches_pr[s] < 1){
				searches_indexes.push(searches_pr[s]);
			}
			
		};
		var best = Math.max.apply(Math, searches_indexes);
		if (searches_pr[search_source.name] === best){
			this.have_best = true;
		}
		
		
	},
	blockSteamPart: function(search_source, can_be_fixed){
		var _ms = this.getMusicStore(search_source);
		this.changed = _ms.changed = (+new Date() > this.changed ? +new Date() : +new Date() + 10);
		_ms.processing = false;
		this.some_results = true;
		if (!_ms.t){
			_ms.failed = true;
			if (can_be_fixed){
				_ms.fixable = true;
				
			}
			return true;
		} else{
			return false;
		}
		
		
	},
	getSomeTracks: function(steam){
		var many_tracks = [];
		for(var source in steam){
			if (!steam[source].failed && steam[source].t){
				many_tracks.push.apply(many_tracks, steam[source].t);
			}
		}
		return !!many_tracks.length && many_tracks;
	},
	by_best_search_index: function(g,f){
		if (g && f) {
			var gg = searches_pr[g.name];
			var ff = searches_pr[f.name];
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
	getAllSongTracks: function(){
		
		if (!this.steams){
			return false;
		}
		var tracks_pack = [];
		for(var steam in this.steams){
			var m = this.getSomeTracks(this.steams[steam]);
			if (m){
				tracks_pack.push({
					name: steam,
					t: m
				})
			}
		}
		tracks_pack.sort(this.by_best_search_index);
		return !!tracks_pack.length && tracks_pack;
	},
	getMusicStore: function( search_source){
		
		var ss = {
			name: (search_source && search_source.name) || 'sample',
			key: (search_source && search_source.key) || 0
		};
		
		if (!this.steams){
			this.steams = {};
		}
		if (!this.steams[ss.name]){
			this.steams[ss.name] = {};
		}
		if (!this.steams[ss.name][ss.key]){
			this.steams[ss.name][ss.key] = {
				name: ss.name,
				key: ss.key
			};
		}
		return this.steams[ss.name][ss.key];
	},
	
	
	addSong: function(mo, get_next){
		if (!bN(this.songs.indexOf(mo))){
			this.songs.push(mo);
			mo.sem = this;
			if (this.some_results){
				handle_song(mo, this.search_completed, get_next);
			}
		} 
		
	},
	removeSong: function(mo){
		var i = this.songs.indexOf(mo);
		if (bN(i)){
			delete this.songs[i];
		}
	},
	emmit_handler: function(c, complete){
	
		if (!c.done){
			if (c.filter){
				var r = this.getSteamData(c.filter);
				if (r){
					c.handler(r.failed && {failed: true}, [r], c, complete);
					
				} else if (!su.mp3_search.haveSearch(c.filter)){
					c.handler({not_exist: true}, false, c, complete);
					
				}
			} else{
				var r = this.getSteamsData();
				if (r){
					c.handler(false, r, c, complete);
					
				} else{
					c.handler(false, false, c, complete);
					
				}
			}
		}
	},
	addHandler: function(oh){
		this.fdefs.push(oh);
		this.emmit_handler(oh);
	},
	emit: function(complete, get_next){
		for (var i=0; i < this.songs.length; i++) {
			if (this.songs[i]){
				handle_song(this.songs[i], complete, get_next);
			}
			
		}
		
		for (var i=0; i < this.fdefs.length; i++) {
			this.emmit_handler(this.fdefs[i], complete, get_next)
			
			
			
		}
		
	},
	wait_ui: function(){
		for (var i=0; i < this.songs.length; i++) {
			var mo = this.songs[i];
			if (mo && mo.ui && !mo.have_tracks){
				mo.ui.node.addClass('search-mp3');
			}
		}
		
		for (var i=0; i < this.fdefs.length; i++) {
			if (!this.fdefs[i].done && this.fdefs[i].while_wait){
				this.fdefs[i].while_wait(); 
			}
			
		}
	},
	isHaveAnyResultsFrom: function(source_name){
		return !!this.getSteamData(source_name);
	}
};







function getSongMatchingIndex(song, query){
	var _ar = song.artist,
		_tr = song.track;
		
	var artist = query.artist,
		track = query.track;
	
	if (!track && !artist){
		if (!query.q){
			return -1000;
		} else{
			artist = query.q;
			_tr = '';
			track = '';
		}
		
	}
		
	var mi = 0;
	
	
	var epic_fail_test = artist + ' ' + track,
		epic_fail = !bN(epic_fail_test.indexOf(artist.replace(/^The /, ''))) && !bN(epic_fail_test.indexOf(track));
	
	if (epic_fail){
		return mi = -1000;
	} else{
		if ((_ar == artist) && (_tr == track)){
			return mi;
		} 
		--mi;
		if ((_ar.toLowerCase() == artist.toLowerCase()) && (_tr.toLowerCase() == track.toLowerCase())){
			return mi;
		} 
		--mi;
		if ((_ar.replace(/^The /, '') == artist.replace(/^The /, '')) && (_tr == track)){
			return mi;
		} 
		--mi;
		if ((_ar.replace(/^The /, '') == artist.replace(/^The /, '')) && (_tr.replace(/.mp3$/, '') == track)){
			return mi;
		} 
		--mi;
		if ((_ar.toLowerCase() == artist.replace(/^The /).toLowerCase()) && (_tr.toLowerCase() == track.toLowerCase())){
			return mi;
		} 
		--mi;
		if (bN(_ar.indexOf(artist)) && bN(_tr.indexOf(track))) {
			return mi;
		} 
		--mi;
		if (bN(_ar.toLowerCase().indexOf(artist.toLowerCase())) && bN(_tr.toLowerCase().indexOf(track.toLowerCase()))) {
			return mi;
		} 
		
		--mi 
		return mi;
		
	}
	
		
	
};


function by_best_matching_index(g,f, query){
	if (g && f) {
		if (getSongMatchingIndex(g,query) < getSongMatchingIndex(f, query)){
			return 1;
		}
		else if (getSongMatchingIndex(g, query) > getSongMatchingIndex(f, query)){
			return -1;
		}
		else{
			return 0;
		}
	} else {
		return 0;
	}
};

function kill_music_dubs(array) {
	var cleared_array = [];
	for (var i=0; i < array.length; i++) {
		if (!has_music_copy(array, array[i], i+1)){
			cleared_array.push(array[i]);
		}
	}
	return cleared_array
};
function has_music_copy(array, entity, from_position){
	var ess = /(^\s*)|(\s*$)/g;
	if (!array.length) {return false}
	
	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist.replace(ess, '') == entity.artist.replace(ess, '')) && (array[i].track.replace(ess, '') == entity.track.replace(ess, '')) && (array[i].duration == entity.duration)) {
			return true;
		}
	};
};


function canUseSearch(sem, search_source){
	if (!sem.steams){
		return true;
	}
	if (!sem.steams[search_source.name]){
		return true;
	}
	
	var my_steam = sem.steams[search_source.name][search_source.key];
	if (my_steam){
		if (my_steam.failed){
			if (my_steam.fixable){
				return true;
			} else{
				return false;
			}
		} else if (my_steam.t){
			return false; 
		} else if (my_steam.processing){
			return false; 
		} else{
			return true;
		}
		
	}
		
	var fixable = true;
	var getted = false;
	for (var steam in sem.steams) {
		if (sem.steams[steam].t){
			getted = true;
		}
		if (sem.steams[steam].failed && !sem.steams[steam].fixable){
			fixable = false;
		}
		
	};
	if (!getted && fixable){
		return true;
	} else{
		return false;
	}
};
function handle_song(mo, complete, get_next){
	
	
	
	if (complete){
		if (mo.ui){
			mo.ui.node.removeClass('search-mp3');
		}
		
		if (mo.isHaveTracks()){
			clearTimeout(mo.cantwait);
			
			if (get_next){
				if (mo.ui){
					mo.ui.updateSongContext(get_next)
				}

				if (su.player.c_song && !su.player.c_song.load_finished) {
					if (mo == su.player.c_song.next_song && su.player.musicbox.preloadSong){
						su.player.musicbox.preloadSong(su.player.c_song.next_song.song().link);
					} 
				}
			} else{
				wantSong(mo);
			}
		} else{
			if (mo.ui){
				mo.ui.node.addClass('search-mp3-failed').removeClass('waiting-full-render');
				
			}
			if (get_next){
				if (su.player.c_song) {
					if (mo == su.player.c_song.next_song || mo == su.player.c_song.prev_song || mo == su.player.c_song.next_preload_song){
						su.player.fix_songs_ui();
					}
					if (su.player.c_song.next_preload_song){
						get_next_track_with_priority(su.player.c_song.next_preload_song);
					}
				}
			}
		}
	} else if (mo.isHaveBestTracks()){
		clearTimeout(mo.cantwait);
		wantSong(mo);
	} else if (mo.isHaveTracks()){
		mo.cantwait = setTimeout(function(){
			if (mo.ui){
				mo.ui.node.removeClass('search-mp3');
			
			}
			wantSong(mo);
			
		},20000);
	}
	
	if (mo.isHaveTracks() || mo.isHaveBestTracks()){
		if (mo.ui){
			mo.ui.update();
			su.ui.els.export_playlist.addClass('can-be-used');
		}
		
	}
};

var get_mp3 = function(msq, options, p, callback, just_after_request){
	var o = options || {};
	var search_query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));
	
	//o ={handler: function(){}, nocache: false, only_cache: false, get_next: false}
	
	if (!o.nocache && !o.only_cache){
		su.ui.els.art_tracks_w_counter.text((su.delayed_search.tracks_waiting_for_search += 1) || '');
	}
	
	var count_down = function(search_source, music_list, can_be_fixed){
		var complete = p.n !== 0 && --p.n === 0;
		if (!o.nocache && !o.only_cache){
			su.ui.els.art_tracks_w_counter.text((su.delayed_search.tracks_waiting_for_search -= 1) || '');
		}
		if (callback){
			callback(!music_list, search_source, complete, music_list, can_be_fixed)
		}
	};

	var callback_success = function(music_list, search_source){
		music_list.sort(function(g,f){
			return by_best_matching_index(g,f, msq)
		});
		cache_ajax.set(search_source.name + 'mp3', search_query, {
			music_list: music_list,
			search_source: search_source
		});
		
		
		//success
		for (var i=0; i < music_list.length; i++) {
			music_list[i].raw = true;
		};
		
		count_down(search_source, music_list);
		
	};
	
	var callback_error = function(search_source, can_be_fixed){
		//error
		count_down(search_source, false, can_be_fixed);
	};
	var used_successful = o.handler(msq, callback_success, callback_error, o.nocache, just_after_request, o.only_cache);
	
	
	return used_successful;
};


var needSearch = function(sem, source_name){
	var r = sem.getSteamData(source_name);
	return !r || !r.t;
};
su.mp3_search= (function(){
		var s = [];
		s.ids=[];
		s.search_emitters = {};
		s.updateStoringOfId = function(really_save, subraw, handler, stillNeed, i){
				if (this.ids[i]){
					if (!really_save){
						delete this.ids[i]
					}
					
				} else{
					if (really_save){
						if (stillNeed){
							this.ids.push({
								subraw: subraw,
								handler: handler,
								stillNeed: stillNeed});
						}
						
					}
				}
		};
		s.getById = function(subraw, callback, stillNeed, wait, i){
			var _this= this;
			if (callback && subraw && subraw.id && subraw.type){
				var enjs = this.getMasterSlaveSearch(subraw.type);
				var enj = (enjs && (enjs.exist_alone_master || enjs.exitst_master_of_slave || enjs.exist_slave));
				if (enj){
					var q = enj.getById(subraw.id, 
						function(song){
							song.raw = true;
							_this.updateStoringOfId(callback(song), subraw, callback, stillNeed, i);
						}, 
						function(){
							_this.updateStoringOfId(callback(), subraw, callback, stillNeed, i);
						}, false, wait);
					if (q && q.q && q.q.init){
						q.q.init();
					}	
						
				} else{
					this.updateStoringOfId(callback(false, true), subraw, callback, stillNeed, i);
				}
			} else{
				callback();
			}
			
			
				
		};
		
		
		s.abortAllSearches = function(){
			for (var i=0; i < this.length; i++) {
				if (this[i].q && this[i].q.abort){
					this[i].q.abort;
				}
			};
		};
		s.getCache = function(sem, name){
			return cache_ajax.get(name + 'mp3', sem.q, function(r){
				
				sem.addSteamPart(r.search_source, r.music_list);
				sem.emit();
				
			});
		};
		
		s.searchFor = function(query, init, filter, options){
			if (options){
				if (options.collect_for){
					query.collect_for = options.collect_for;
				}
				if (options.last_in_collection){
					query.last_in_collection = options.last_in_collection;
				}	
			}
			
			
			var q = HTMLDecode(query.q || (query.artist + ' - ' + query.track));
			var o = options || {};
			
			
			var seeking_something_fresh;
			var sem = this.search_emitters[q] || (this.search_emitters[q] = new musicSeachEmitter(q, query));
			if (init){
				seeking_something_fresh = init(sem);
			}
	
			var tried_cache = [];
			
			
			var search_handlers = [];
			for (var i=0; i < this.length; i++) {
				var cursor = this[i];
				var _c; //cache
				if ((!filter || cursor.name == filter) && needSearch(sem, cursor.name)){
					if (!seeking_something_fresh && !bN(tried_cache.indexOf(cursor.name))){
						_c = this.getCache(sem, cursor.name);
						tried_cache.push(cursor.name);
					}
					
					if (!_c && !cursor.disabled){
						if (!cursor.preferred || cursor.preferred.disabled){
							var can_search = cursor.test(sem);
							if (can_search){
								search_handlers.push(cursor);
							}
								
						}
						
					}
				}
				
			};
			var p = {
				n: search_handlers.length
			};
			var successful_uses = []
			
			if (search_handlers.length){
				for (var i=0; i < search_handlers.length; i++) {
					
					var handler = (!o.only_cache && search_handlers[i].search) || search_handlers[i].collectiveSearch;
					if (handler){
						if (!o.only_cache){
							sem.getMusicStore(search_handlers[i].s).processing = true;
						}
						
						var used_successful =  get_mp3(query, {
							handler: handler,
							get_next: o.get_next
						}, p, function(err, search_source, complete, music_list, can_be_fixed){
							if (err){
								if (search_source){
									sem.blockSteamPart(search_source, can_be_fixed);
								}
							} else{
								sem.addSteamPart(search_source, music_list);
							}
							if (complete){
								sem.search_completed = true;
							}
							sem.emit(complete, o.get_next);
						}, function(){
							sem.wait_ui();
						});
						if (used_successful){successful_uses.push(used_successful)}
					}
					
					
					
					
				};
			} else if (!o.only_cache && !seeking_something_fresh){
				sem.emit(sem.search_completed = true, o.get_next);
			}

	
			
			return !!successful_uses.length && successful_uses;
		},
		s.find_mp3 = function(mo, options){
			if (!mo.artist || !mo.track || mo.raw() ){
				return false;
			}
			var music_query = {
				artist:mo.artist,
				track: mo.track
			};
			var mqs = mo.artist + ' - '+ mo.track;
			var successful_uses = this.searchFor(music_query, function(sem){
				if (!mo.handled){
					sem.addSong(mo, !!options && options.get_next);
					mo.handled = true;
					
				} 
				var force_changed;
				if (!mo.was_forced){
					if (!options || !options.only_cache){
						mo.was_forced = true;
						force_changed = true;
					}
					
				}
				return !force_changed && mo.was_forced && mo.isSearchCompleted();

				
			}, false, options);
			
			if (successful_uses){
				for (var i=0; i < successful_uses.length; i++) {
					var used_successful = successful_uses[i];
					if (typeof used_successful == 'object'){
						var has_pr = mo.want_to_play;
						if (has_pr) {
							used_successful.pr = has_pr;
						}
						mo.delayed_in.push(used_successful);
						used_successful.q.init();
					};
				};
			}
			
			
			
		};
		s.find_files = function(q, filter, callback, options){
			
			var successful_uses = this.searchFor(q, function(sem){
				sem.addHandler({
					filter: filter,
					handler: callback
				});
			}, filter, options);
			
			if (successful_uses){
				for (var i=0; i < successful_uses.length; i++) {
					var used_successful = successful_uses[i];
					if (typeof used_successful == 'object'){
						used_successful.pr = su.player.want_to_play + 1;
						used_successful.q.init();
					}
				};
			}
			
		};
		var newSearchInit = function(filter){
			for (var am in s.search_emitters){
				if (s.search_emitters[am] instanceof musicSeachEmitter){
					delete s.search_emitters[am].search_completed;
				}
			}
			if (su.player){
				if (su.player.c_song){
					if (su.player.c_song.sem){
						s.searchFor(su.player.c_song.sem.query);
					}
					
					if (su.player.c_song.next_preload_song && su.player.c_song.next_preload_song.sem){
						s.searchFor(su.player.c_song.next_preload_song.sem.query);
					}
				}
				if (su.player.v_song && su.player.v_song != su.player.c_song ){
					if (su.player.v_song.sem){
						s.searchFor(su.player.v_song.sem.query);
					}
					
				}
			}
			for (var i=0; i < s.ids.length; i++) {
				var cursor = s.ids[i];
				if (cursor && cursor.subraw.type == filter){
					if (cursor.stillNeed()){
						s.getById(cursor.subraw, cursor.handler, false, i);
					} else{
						s.updateStoringOfId(false, false, false, false, i);
					}
				}
			};
			
		};
		s.getMasterSlaveSearch = function(filter){
			var o = {
				exist_slave: false,
				exist_alone_master: false,
				exitst_master_of_slave: false
			}
			var exist_slave;
			var exist_alone_master;
			for (var i=0; i < this.length; i++) {
				var cmp3s = this[i];
				if (!cmp3s.disabled && cmp3s.name == filter){
					if (cmp3s.slave){
						if (!o.exist_slave){
							o.exist_slave = cmp3s;
							break
						}
					}
				}
			};
			for (var i=0; i < this.length; i++) {
				var cmp3s = this[i];
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
			};
			return o;
		};
		s.haveSearch = function(search_name){
			var o = this.getMasterSlaveSearch(search_name);	
			return !!o.exist_slave || !!o.exitst_master_of_slave || !!o.exist_alone_master;
		};
		s.isNoMasterOfSlave= function(filter){
			var o = this.getMasterSlaveSearch(filter);
			return !!o.exist_slave && !o.exitst_master_of_slave;
		};
		s.add = function(asearch, force){
			
			
			var push_later;
			
			
			var o = this.getMasterSlaveSearch(asearch.name);
			

			if (o.exist_slave){
				if (force || !o.exitst_master_of_slave){
					if (o.exist_slave.preferred){
						o.exist_slave.preferred.disabled = true;
					}
					
					this.push(asearch);
					o.exist_slave.preferred = asearch;
					newSearchInit(asearch.name);
				} 
			} else if (o.exist_alone_master){
				if (force){
					o.exist_alone_master.disabled = true;
					this.push(asearch);
					newSearchInit(asearch.name);
				}
			} else{
				this.push(asearch);
				newSearchInit(asearch.name);
			}
		}

		return s;
})();

if (typeof soundcloud_search != 'undefined'){
	(function(){
		var sc_search_source = {name: 'soundcloud', key: 0};
		su.mp3_search.add({
			test: function(mo){
				return canUseSearch(mo, sc_search_source);
			},
			getById: soundcloudGetById,
			search: soundcloud_search,
			name: sc_search_source.name,
			description:'soundcloud.com',
			slave: false,
			s: sc_search_source,
			preferred: null,
			q: su.soundcloud_queue
		})
		
		
	})();
	
};