(function() {
"use strict";
var counter = 0;

provoda.addPrototype("baseSong",{
	model_name: "song",
	init: function(omo, playlist, player, mp3_search){
		this._super();
		this.plst_titl = playlist;
		this.mp3_search = mp3_search;
		this.player = player;
		
		this.uid = ++counter;
		cloneObj(this, omo, false, ['artist', 'track']);
		this.omo = omo;
		if (omo.artist){
			this.updateState('artist', omo.artist);
		}
		if (omo.track){
			this.updateState('track', omo.track);
		}
		this.on('request', function() {
			this.plst_titl.checkRequestsPriority();
		});
	},
	state_change: {
		"mp-show": function(opts) {
			if (opts){
				this.prepareForPlaying();
				
				
			} else {
				this.removeMarksFromNeighbours();
			}
		},
		"player-song": function(state){
			var _this = this;

			if (state){
				setTimeout(function() {
					if (!_this.state("mp-show") && _this.isSearchCompleted()){
						
						_this.checkNeighboursChanges(false, false, "player song");
					}
					
				}, 0);
				
				
				
				this.mp3_search.on("new-search.player-song", function(){
					_this.findFiles();
					_this.checkNeighboursChanges(false, false, "new search, player song");
					if (_this.next_preload_song){
					//	_this.next_preload_song.findFiles();
					}
				}, {exlusive: true});
			}
		},
		"is_important": function(state){
			if (!state){
				this.unloadFor(this.uid);

				cloneObj(this, {
					next_song: false,
					prev_song: false,
					next_preload_song: false
				});
			}
		}
	},
	prepareForPlaying: function() {
		var _this = this;

		this.makeSongPlayalbe(true);
		setTimeout(function() {
			_this.checkNeighboursChanges(false, true, "track view");
		}, 0);
		this.mp3_search.on("new-search.viewing-song", function(){
			_this.findFiles();
			_this.checkNeighboursChanges(false, true, "track view");
		}, {exlusive: true});
	},
	simplify: function() {
		return cloneObj({}, this, false, ['track', 'artist']);
	},
	
	mlmDie: function() {
		
	},
	complex_states: {
		'song-title': {
			depends_on: ['artist', 'track'],
			fn: function(artist, track){
				return this.getFullName(artist, track);
			}
		},
		'full-title': {
			depends_on: ['artist', 'track'],
			fn: function(artist, track){
				return this.getFullName(artist, track);
			}
		},
		is_important: {
			depends_on: ['mp-show', 'player-song', 'want_to_play'],
			fn: function(mp_show, player_song, wapl){
				this.plst_titl.checkRequestsPriority();
				return !!(mp_show || player_song || wapl);

			}
		}
	},
	getFullName: function(artist, track, allow_short){
		var n = '';
		if (this.artist){
			if (this.track){
				if (allow_short && this.plst_titl && (this.plst_titl.info && this.plst_titl.info.artist == this.artist)){
					n = this.track;
				} else {
					n = this.artist + " - " + this.track;
				}
			} else {
				n = this.artist;
			}
		} else if (this.track){
			n = this.track;
		}
		return n || 'no title';
	},
	updateNavTexts: function() {
		var title = this.state('full-title');
		this.updateState('nav-text', title);
		this.updateState('nav-title', title);
	},
	playNext: function(auto) {
		if (this.state('rept-song')){
			this.play()
		} else {
			this.plst_titl.switchTo(this, true, auto);
		}
		
	},
	playPrev: function() {
		this.plst_titl.switchTo(this);
	},
	findNeighbours: function(){
		this.plst_titl.findNeighbours(this);
	},
	checkAndFixNeighbours: function(){
		this.findNeighbours();
		this.addMarksToNeighbours();
	},
	downloadLazy: debounce(function(){
		var song = getTargetField(this.mf_cor.songs(), "0.t.0");
		if (song){
			downloadFile(song.link);
		}
	}, 200),
	canPlay: function() {
		return this.mf_cor.canPlay();
	},
	preloadFor: function(id){
		this.mf_cor.preloadFor(id);
	},
	unloadFor: function(id){
		this.mf_cor.unloadFor(id);
	},
	setVolume: function(vol, fac){
		this.mf_cor.setVolume(vol, fac);
	},
	stop: function(){
		this.mf_cor.stop();
	},
	switchPlay: function(){
		this.mf_cor.switchPlay();
	},
	pause: function(){
		this.mf_cor.pause();
	},
	play: function(mopla){
		this.mf_cor.play(mopla);

	},
	markAs: function(neighbour, mo){
		if (!this.neighbour_for){
			this.neighbour_for = mo;
			this.updateState('marked_as', neighbour);
		}
	},
	unmark: function(mo){
		if (this.neighbour_for == mo){
			delete this.neighbour_for;
			this.updateState('marked_as', false);

		}
	},
	wasMarkedAsPrev: function() {
		return this.state('marked_as') && this.state('marked_as') == 'prev';
	},
	wasMarkedAsNext: function() {
		return this.state('marked_as') && this.state('marked_as') == 'next';
	},
	addMarksToNeighbours: function(){
		
		if (!this.marked_prev_song || this.marked_prev_song != this.prev_song){
			if (this.marked_prev_song){
				this.marked_prev_song.unmark(this);
			}
			if (this.prev_song){
				(this.marked_prev_song = this.prev_song).markAs('prev', this);
			}
		}
		if (!this.marked_next_song || this.marked_next_song != this.next_song){
			if (this.marked_next_song){
				this.marked_next_song.unmark(this);
			}
			if (this.next_song){
				(this.marked_next_song = this.next_song).markAs('next', this);
			}
		}
			
		
	},
	removeMarksFromNeighbours: function(){
		if (this.marked_prev_song){
			this.marked_prev_song.unmark(this);
			delete this.marked_prev_song;
		}
		if (this.marked_next_song){
			this.marked_next_song.unmark(this);
			delete this.marked_next_song;
		}
	},
	wheneWasChanged: function(){
		return (this.raw() && 1) || (this.sem && this.sem.changed || 1);
	},
	waitToLoadNext: function(ready){
		this.ready_to_preload = ready;
		if (ready){
			if (!this.waiting_to_load_next && this.player.c_song == this && this.next_preload_song){
				var nsong = this.next_preload_song;
				var uid = this.uid;
				this.waiting_to_load_next = setTimeout(function(){
					nsong.preloadFor(uid);
				}, 4000);
			}
		} else if (this.waiting_to_load_next){
			clearTimeout(this.waiting_to_load_next);
			delete this.waiting_to_load_next;
		}
	},
	isImportant: function() {
		return this.state('is_important');
	},
	canUseAsNeighbour: function(){
		return (this.canSearchFiles() && (this.canPlay() || !this.isSearchCompleted())) || (!this.track && this.canFindTrackTitle());
	},
	checkNeighboursChanges: function(changed_neighbour, viewing, log) {
		this.plst_titl.checkNeighboursChanges(this, changed_neighbour, viewing, log);
	},
	hasNextSong: function(){
		return !!this.next_song;
	},
	canFindTrackTitle: function() {
		return !this.state("no-track-title")
	},
	getRandomTrackName: function(full_allowing, from_collection, last_in_collection){
		this.updateState('track-name-loading', true);
		var _this = this;
		if (!this.track && !this.rtn_request){
			var request = this.rtn_request = lfm.get('artist.getTopTracks',{'artist': this.artist, limit: 30, page: 1 })
				.done(function(r){
					var tracks = toRealArray(getTargetField(r, 'toptracks.track'));

					

					if (_this.track){
						return;
					}

					tracks = $filter(tracks, 'name');
					var some_track = tracks[Math.floor(Math.random()*tracks.length)];
					if (some_track){
						_this.track = some_track;
						_this.updateState('track', some_track);
						_this.updateNavTexts();

						_this.findFiles({
							only_cache: !full_allowing,
							collect_for: from_collection,
							last_in_collection: last_in_collection
						});
						_this.trigger('url-change');



					} else {
						_this.updateState("no-track-title", true);
					}

					

				})
				.always(function(){
					
					_this.updateState('track-name-loading', false);
					if (_this.rtn_request == request){
						delete _this.rtn_request;
					}
					_this.checkChangesSinceFS();
				});
		
			this.addRequest(request);
		}
	},
	prefindFiles: function(){
		this.findFiles({
			get_next: true
		});
	},
	findFiles: function(opts){
		if (this.mp3_search){
			opts = opts || {};
			opts.only_cache = opts.only_cache && !this.state('want_to_play') && (!this.player.c_song || this.player.c_song.next_preload_song != this);
		
			if (!this.artist || !this.track || this.raw() ){
				return false;
			}
			var _this = this;
			var music_query = {
				artist:this.artist,
				track: this.track
			};

			this.mp3_search.searchFor(music_query, function(sem){

				if (!_this.sem){
					_this.sem = sem;
					if (_this.mf_cor){
						_this.mf_cor.setSem(_this.sem);
					}
					sem.on('progress', function() {
						_this.filesSearchStarted();
					});
					sem.on('changed', function(complete){
						_this.updateFilesSearchState(complete);
					});
				}

				var force_changed;
				if (!_this.was_forced){
					if (!opts || !opts.only_cache){
						_this.was_forced = true;
						force_changed = true;
					}
					
				}
				return !force_changed && _this.was_forced && _this.isSearchCompleted();
			}, false, opts);


			
			var reqs = this.sem.getRequests();
			for (var i = 0; i < reqs.length; i++) {
				this.addRequest(reqs[i], false, true);
			}
			
			var queued = this.sem.getQueued();
			for (var i = 0; i < queued.length; i++) {
				queued[i].q.init();
			}

			//this.mp3_search.find_mp3(this, opts);
		}
	},
	makeSongPlayalbe: function(full_allowing,  from_collection, last_in_collection){
		if (this.raw()){
			this.updateState('playable', true);
		} else if (!this.track && full_allowing){
			if (this.getRandomTrackName){
				this.getRandomTrackName(full_allowing, from_collection, last_in_collection);
			}
			
		} else{
		//	if (this.isSearchCompleted()){
			//	this.updateFilesSearchState(true);
			//}
			this.findFiles({
				only_cache: !full_allowing,
				collect_for: from_collection,
				last_in_collection: last_in_collection
			});
		}
	},
	filesSearchStarted: function(){
		this.updateState('searching-files', true);
	},
	updateFilesSearchState: function(complete){

		var _this = this;

		var opts = {
			complete: complete,
			have_tracks: this.isHaveTracks("mp3"),
			have_best_tracks: this.isHaveBestTracks()
		};
		


		if (complete){
			this.updateState('searching-files', false);
		}
		if (opts.have_tracks){
			this.updateState('playable', true);
		}
		this.trigger('files_search', opts);
		this.updateState('files_search', opts);
		this.checkChangesSinceFS(opts);
	},
	checkChangesSinceFS: function(opts){
		this.plst_titl.checkChangesSinceFS(this, opts);
	},
	view: function(no_navi, user_want){
		if (!this.state('mp-show')){
			this.trigger('view', no_navi, user_want);
		}
	},
	valueOf:function(){
		return (this.artist ? this.artist + ' - ' : '') + this.track;
	},
	isPossibleNeighbour: function(mo) {
		return this.isNeighbour(mo) || mo == this.next_preload_song;
	},
	isNeighbour: function(mo){
		return (mo == this.prev_song) || (mo == this.next_song);
	},
	canSearchFiles: function(){
		return !!(this.artist && this.track);
	},
	setPlayableInfo: function(info){
		this.playable_info = info;
		return this;
	},
	isNeedsAuth: function(service_name){
		return !this.raw() && this.mp3_search && (this.mp3_search.isNoMasterOfSlave(service_name) || !this.mp3_search.haveSearch(service_name));
	},
	raw: function(){
		return this.mf_cor && this.mf_cor.raw();
	},
	isHaveAnyResultsFrom: function(source_name){
		return this.mf_cor && this.mf_cor.isHaveAnyResultsFrom(source_name);
	},
	isHaveTracks: function(type){
		return this.mf_cor && this.mf_cor.isHaveTracks(type);
	},
	isSearchCompleted: function(){
		return this.mf_cor && this.mf_cor.isSearchCompleted();
	},
	isHaveBestTracks: function(){
		return this.mf_cor && this.mf_cor.isHaveBestTracks();
	},
	song: function(){
		return this.mf_cor && this.mf_cor.song();
	},
	songs: function(){
		return this.mf_cor && this.mf_cor.songs();
	},
	posistionChangeInMopla: function(mopla){
		if (this.getCurrentMopla() == mopla){
			this.submitPlayed(true);
			this.submitNowPlaying();

			if (!this.start_time){
				this.start_time = ((new Date() * 1)/1000).toFixed(0);
			}
		}
	},
	getCurrentMopla: function(){
		return this.mf_cor.getCurrentMopla();
	}
});


})();