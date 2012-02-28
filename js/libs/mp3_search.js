(function(){
	var getSongFileModel = function(mo, player){

		return this.models[mo.uid] = this.models[mo.uid] || (new songFileModel(this, mo)).setPlayer(player);
	};

	musicSeachEmitter = function(q, query, mp3Search){
		this.init();
		this.mp3Search = mp3Search;
		this.q = q;
		this.query = query;
		this.fdefs = [];
		this.onRegistration('changed', function(cb) {
			if (this.some_results){
				cb(this.search_completed);
			}
		});
	};
	

	eemiter.extendTo(musicSeachEmitter, {
		canSearchBy: function (search_source){
			if (!this.steams){
				return true;
			}
			if (!this.steams[search_source.name]){
				return true;
			}
			
			var my_steam = this.steams[search_source.name][search_source.key || 0];
			if (my_steam){
				if (my_steam.failed){
					if (!my_steam.non_fixable){
						return true;
					} else{
						return false;
					}
				} else if (my_steam.t || my_steam.fin){
					return false;
				} else if (my_steam.processing){
					return false; 
				} else{
					return true;
				}
				
			}
				
			var fixable = true;
			var getted = false;
			for (var steam in this.steams) {
				var cur = this.steams[steam]
				if (cur != my_steam){
					if (cur.t){
						getted = true;
					}
					if (cur.failed){
						if (cur.non_fixable && !cur.replaceable){
							fixable = false;
						}
						
					}
				}
			};
			if (!getted && fixable){
				return true;
			} else{
				return false;
			}
		},
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
		assignFilesMethods: function(fls){
			for (var i = 0; i < fls.length; i++) {
				fls[i].models = {};
				fls[i].getSongFileModel = getSongFileModel;

			};
		},
		searches_pr: {
			vk: 0,
			lastfm:-10,
			soundcloud: -5
		},
		addSteamPart: function(search_source, t ){
			
			var _ms = this.getMusicStore(search_source);
			if (!_ms.t){


				this.changed = _ms.changed = (+new Date() > this.changed ? +new Date() : +new Date() + 10);
				_ms.t = t;
				this.assignFilesMethods(t);

				
				this.have_tracks = true;
				_ms.processing = false;
				this.some_results = true;
				_ms.failed = false;
				var searches_indexes=[];
				for (var s in this.searches_pr) {
					if (this.searches_pr[s] < 1){
						searches_indexes.push(this.searches_pr[s]);
					}
					
				};
				var best = Math.max.apply(Math, searches_indexes);
				if (this.searches_pr[search_source.name] === best){
					this.have_best = true;
				}
					
				
			} else {
				//fixme
				console.log('lorem! ipsum!')
			}
			
			
			return this;
		},
		blockSteamPart: function(search_source, can_be_fixed){
			var _ms = this.getMusicStore(search_source);
			this.changed = _ms.changed = (+new Date() > this.changed ? +new Date() : +new Date() + 10);
			_ms.processing = false;
			this.some_results = true;
			if (!_ms.t){
				_ms.failed = true;
				if (!can_be_fixed){
					_ms.non_fixable = true;
					
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
				var gg = this.searches_pr[g.name];
				var ff = this.searches_pr[f.name];
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
			var _this = this;
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
			tracks_pack.sort(function(g,f){
				return _this.by_best_search_index(g, f)
			});
			return !!tracks_pack.length && tracks_pack;
		},
		getMusicStore: function( search_source){
			var space_added,
				name 	= (search_source && search_source.name) || 'sample',
				key		= (search_source && search_source.key) || 0;
			
			if (!this.steams){
				this.steams = {};
			}

			if (!this.steams[name]){
				this.steams[name] = {};
				space_added = true;
			}
			if (!this.steams[name][key]){
				this.steams[name][key] = {
					name: name,
					key: key
				};
			}
			if (space_added){
				this.fire('space-added');
			}
			return this.steams[name][key];
		},
		isHaveAnyResultsFrom: function(source_name){
			return !!this.getSteamData(source_name);
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
		change: function(get_next){
			var _this = this;
			setTimeout(function(){
				_this.emit(get_next)
			},100)	
		},
		emit: function(get_next){
			this.fire('changed', this.search_completed, get_next);

			for (var i=0; i < this.fdefs.length; i++) {
				this.emmit_handler(this.fdefs[i], this.search_completed, get_next)
			}
			
		},
		notify: function(){

			this.fire('progress');


			
			for (var i=0; i < this.fdefs.length; i++) {
				if (!this.fdefs[i].done && this.fdefs[i].while_wait){
					this.fdefs[i].while_wait(); 
				}
				
			}
		}
	});
})();





function has_music_copy(array, entity, from_position){
	var ess = /(^\s*)|(\s*$)/g;
	if (!array.length) {return false}
	
	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist.replace(ess, '') == entity.artist.replace(ess, '')) && (array[i].track.replace(ess, '') == entity.track.replace(ess, '')) && (array[i].duration == entity.duration)) {
			return true;
		}
	};
};










(function() {



	var getSongMatchingIndex = function(song, query){
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


	var by_best_matching_index = function(g,f, query){
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



	var needSearch = function(sem, source_name){
		var r = sem.getSteamData(source_name);
		return !r || !r.t;
	};

	mp3Search = function(){
		this.init();
		this.ids = [];
		this.se_list = [];
		this.search_emitters = {};

	};

	eemiter.extendTo(mp3Search,  {
		updateStoringOfId: function(really_save, subraw, handler, stillNeed, i){
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
		},
		getById: function(subraw, callback, stillNeed, wait, i){
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
		},
		getCache: function(sem, name){
			return cache_ajax.get(name + 'mp3', sem.q, function(r){
				
				sem.addSteamPart(r.search_source, r.music_list);
				sem.change();
				
			});
		},
		request: function(msq, options, p, just_after_request){
			var o = options || {};
			var search_query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));
			var deferred = $.Deferred(),
				complex_response = new depdc(true);
			complex_response.abort = function() {
				this.aborted = true;
				if (this.queued){
					this.queued.abort();
				}
			};
			deferred.promise( complex_response );

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
				deferred.resolve(search_source, music_list);

				//count_down(search_source, music_list);
				
			};
			
			var callback_error = function(search_source, non_fixable){
				//error
				deferred.reject(search_source, non_fixable);
				//count_down(search_source, false, can_be_fixed);
			};
			var used_successful = o.handler(msq, callback_success, callback_error, o.nocache, just_after_request, o.only_cache);
			
			if (used_successful){
				if (used_successful === Object(used_successful)){
					complex_response.queued = used_successful;
				} else {
					complex_response.cache_used = true;
				}
			}
			return complex_response;
		},
		searchFor: function(query, init, filter, options){
			var _this = this;
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
			var sem = this.search_emitters[q] || (this.search_emitters[q] = new musicSeachEmitter(q, query, this));
			if (init){
				seeking_something_fresh = init(sem);
			}

			var tried_cache = [];
			
			
			var search_handlers = [];

			for (var i=0; i < this.se_list.length; i++) {
				var cursor = this.se_list[i];
				var _c; //cache
				if ((!filter || cursor.name == filter) && needSearch(sem, cursor.name)){
					if (!seeking_something_fresh && !bN(tried_cache.indexOf(cursor.name))){
						_c = this.getCache(sem, cursor.name);
						tried_cache.push(cursor.name);
					}
					
					if (!_c && !cursor.disabled){
						if (!cursor.preferred || cursor.preferred.disabled){



							var can_search = sem.canSearchBy(cursor)//cursor.test(sem);
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
			var successful_uses = [];


			var request = function(sem, handler, o, p){
				var used_successful =  _this.request(query, {handler: handler, get_next: o.get_next}, p, function(){	sem.notify();})
					.done(function(search_source, music_list){
						if (music_list && music_list.length){
							sem.addSteamPart(search_source, music_list);
						} else {
							sem.blockSteamPart(search_source, true);
						}
						
					})
					.fail(function(search_source, non_fixable){
						if (search_source){
							sem.blockSteamPart(search_source, !non_fixable);
						}
					})
					.always(function(){
						sem.change(o.get_next);
					});
					if (used_successful){
						successful_uses.push(used_successful);
						sem.addRequest(used_successful);
					}
			}
			
			if (search_handlers.length){
				for (var i=0; i < search_handlers.length; i++) {
					
					var handler = (!o.only_cache && search_handlers[i].search) || search_handlers[i].collectiveSearch;
					if (handler){
						if (!o.only_cache){
							sem.getMusicStore(search_handlers[i].s).processing = true;
						}
						request(sem, handler, o, p);
					}
				};
				$.when.apply($, successful_uses).always(function(){
					if (!o.only_cache){
						sem.search_completed = true;
					}
					
				});
			} else if (!o.only_cache && !seeking_something_fresh){
				sem.search_completed = true
				sem.change(o.get_next);
			}
			return sem;
		},
		findFiles: function(msq, options) {
			

			return df;
		},
		
		find_files: function(q, filter, callback, options){
			var semi;
			var successful_uses = this.searchFor(q, function(sem){
				semi = sem;
				sem.addHandler({
					filter: filter,
					handler: callback
				});
			}, filter, options);
			

			semi.setPrio('highest');

			//var reqs = semi.getRequests
			var queued = semi.getQueued();
			for (var i = 0; i < queued.length; i++) {
				queued[i].q.init();
			};		
		},
		newSearchInit: function(filter, search){
			for (var am in this.search_emitters){
				if (this.search_emitters[am] instanceof musicSeachEmitter){
					delete this.search_emitters[am].search_completed;
				}
			}
			

			for (var i=0; i < this.ids.length; i++) {
				var cursor = this.ids[i];
				if (cursor && cursor.subraw.type == filter){
					if (cursor.stillNeed()){
						this.getById(cursor.subraw, cursor.handler, false, i);
					} else{
						this.updateStoringOfId(false, false, false, false, i);
					}
				}
			};
			this.fire('new-search', search, filter);
			
		},
		getMasterSlaveSearch: function(filter){
			var o = {
				exist_slave: false,
				exist_alone_master: false,
				exitst_master_of_slave: false
			}
			var exist_slave;
			var exist_alone_master;
			for (var i=0; i < this.se_list.length; i++) {
				var cmp3s = this.se_list[i];
				if (!cmp3s.disabled && cmp3s.name == filter){
					if (cmp3s.slave){
						if (!o.exist_slave){
							o.exist_slave = cmp3s;
							break
						}
					}
				}
			};
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
			};
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
		removeSearch: function(msearch) {
			
		}

	});
})();

