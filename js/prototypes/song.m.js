createSongBase = function(model) {

var counter = 0;
var baseSong = function(){};
model.extendTo(baseSong, {
	state_change: {
		"mp-show": function(opts) {
			if (opts){
				this.checkAndFixNeighbours();
			} else {
				this.removeMarksFromNeighbours();
			}
		}
	},
	init: function(omo, player, mp3_search){
		this._super();
		this.mp3_search = mp3_search;
		this.player = player;
		
		this.uid = ++counter;
		cloneObj(this, omo, false, ['artist', 'track']);
		this.omo = omo;
		this.updateState('song-title', this.getFullName());
	},
	mlmDie: function() {
		
	},
	getFullName: function(allow_short){
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
		return n || 'no title'
	},
	updateNavTexts: function() {
		var title = this.getFullName(true); 
		this.updateState('nav-text', title);
		this.updateState('nav-title', title);
	},
	playNext: function(auto) {
		this.plst_titl.switchTo(this, true, auto)
	},
	playPrev: function() {
		this.plst_titl.switchTo(this)
	},

	findNeighbours: function(){
		this.plst_titl.findNeighbours(this);
	},
	checkAndFixNeighbours: function(){
		this.findNeighbours();
		this.addMarksToNeighbours();
	},
	preloadSongFile: function(){
		this.mf_cor.preloadSongFile();
	},
	setVolume: function(vol){
		this.mf_cor.setVolume(vol);
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
		this.mf_cor.play(mopla)

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
			if (!this.waiting_to_load_next && this.player.c_song == this && this.next_song){
				var next_song = this.next_song;
				this.waiting_to_load_next = setTimeout(function(){
					next_song.preloadSongFile();
				}, 4000);
			}
		} else if (this.waiting_to_load_next){
			clearTimeout(this.waiting_to_load_next);
			delete this.waiting_to_load_next;
		}
	},
	getRandomTrackName: function(full_allowing, from_collection, last_in_collection){
		this.updateState('loading', true);
		var _this = this;
		this.addRequest(
			lfm.get('artist.getTopTracks',{'artist': this.artist, limit: 30 })
				.done(function(r){
					var tracks = toRealArray(getTargetField(r, 'toptracks.track'))
					tracks = $filter(tracks, 'name');
					var some_track = tracks[Math.floor(Math.random()*tracks.length)];
					if (some_track){
						_this.track = some_track;
						_this.updateState('song-title', _this.getFullName());
						//_this.updateProp('track', some_track);
						_this.updateNavTexts();
						_this.findFiles({
							only_cache: !full_allowing,
							collect_for: from_collection,
							last_in_collection: last_in_collection
						});
					}
					
				})
				.always(function(){
					_this.updateState('loading', false);
				}));
		
	},
	prefindFiles: function(){
		this.findFiles({
			get_next: true
		});
		this.setPrio('highest');
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

			var oldFilesSearchCb = this.filesSearchCb;

			this.filesSearchCb = function(complete) {
				_this.updateFilesSearchState(complete, opts.get_next);
			};


			this.mp3_search.searchFor(music_query, function(sem){

				if (!_this.sem){
					_this.sem = sem;
					if (_this.mf_cor){
						_this.mf_cor.setSem(_this.sem);
					}
					sem.on('progress', function() {
						_this.filesSearchStarted();
					})
				}

				if (oldFilesSearchCb){
					sem.off('changed', oldFilesSearchCb);
				}

				sem.on('changed', _this.filesSearchCb);

				var force_changed;
				if (!_this.was_forced){
					if (!opts || !opts.only_cache){
						_this.was_forced = true;
						force_changed = true;
					}
					
				}
				return !force_changed && _this.was_forced && _this.isSearchCompleted();
			}, false, opts);


			if (this.state('want_to_play')) {
				this.sem.setPrio('highest');
			}
			var reqs = this.sem.getRequests();
			for (var i = 0; i < reqs.length; i++) {
				this.addRequest(reqs[i], true);
			};
			
			var queued = this.sem.getQueued();
			for (var i = 0; i < queued.length; i++) {
				queued[i].q.init();
			};

			//this.mp3_search.find_mp3(this, opts);
		}
	},
	makeSongPlayalbe: function(full_allowing,  from_collection, last_in_collection){
		if (this.raw()){
			this.updateState('playable', true);
		} else if (!this.track){
			if (this.getRandomTrackName){
				this.getRandomTrackName(full_allowing, from_collection, last_in_collection);
			}
			
		} else{
			if (this.isSearchCompleted()){
				this.updateFilesSearchState(true)
			}
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
	updateFilesSearchState: function(complete, get_next){

		var _this = this;

		var opts = {
			complete: complete,
			have_tracks: this.isHaveTracks(), 
			have_best_tracks: this.isHaveBestTracks()
		}
		if (complete){
			this.updateState('searching-files', false);
			if (opts.have_tracks){
				if (get_next && this.player.c_song){
					if (this.player.c_song.ready_to_preload && (this == this.player.c_song.next_song)) {
						this.preloadSongFile();
					}
				} 
			} else{
				if (get_next){
					if (this.player.c_song) {
						if (this.player.c_song.isNeighbour(this) || this == this.player.c_song.next_preload_song){
							this.player.c_song.checkAndFixNeighbours();
						}
						if (this.player.c_song.next_preload_song){
							this.player.c_song.next_preload_song.prefindFiles();
						}
					}
				}
			}
		} 
		if (opts.have_tracks){
			this.updateState('playable', true);
		}
		this.trigger('files_search', opts);
		this.updateState('files_search', opts);
	},
	view: function(no_navi, user_want){
		if (!this.state('mp-show')){
			this.trigger('view', no_navi, user_want);
			this.findFiles();
		}
	},
	getURL: function(mopla){
		var url ="";
		if (mopla || this.raw()){
			var s = mopla || this.omo;
			url += "/" + s.from + '/' + s._id;
		} else{
			if (this.plst_titl && this.plst_titl.playlist_type == 'artist'){
				if (this.track){
					url += '/' + this.track;
				}
			} else if (this.artist){
				url += '/' + this.artist + '/' + (this.track || '_');
			}
		}
		return url;
	},
	valueOf:function(){
		return (this.artist ? this.artist + ' - ' : '') + this.track;
	},
	isNeighbour: function(mo){
		return (mo == this.prev_song) || (mo == this.next_song);
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
	}
});

return baseSong;

};


