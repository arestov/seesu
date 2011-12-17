(function(){
var counter = 0;
baseSong = function(){};
baseSong.prototype = new servModel();
var song_methods = {
	constructor: baseSong,
	state_change: {
		
	},
	getFullName: function(allow_short){
		var n = '';
		if (this.artist){
			if (this.track){
				if (allow_short && (this.plst_titl.info && this.plst_titl.info.artist == this.artist)){
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
	findNeighbours: function(){
		//using for visual markering and determination of what to presearch
		this.next_preload_song = false;
		this.next_song = false
		this.prev_song = false
		
		var c_playlist = this.plst_titl,
			c_num = this.plst_titl.indexOf(this);//this.play_order

		var can_use = [];
		for (var i=0; i < c_playlist.length; i++) {
			var cur = c_playlist[i];
			if (cur && (cur.isHaveTracks() || !cur.isSearchCompleted())){
				can_use.push(i);
			}
		};	
		if (c_playlist && typeof c_num == 'number'){
			if (c_num-1 >= 0) {
				for (var i = c_num-1, _p = false;  i >= 0; i--){
					
					if (bN(can_use.indexOf(i))){
						this.prev_song = c_playlist[i];
						break
					}
				};
			}
			var next_song = c_num+1;
			var preload_song;
			for (var i = 0, _n = false; i < c_playlist.length ; i++) {
				if (bN(can_use.indexOf(i))){
					if (!preload_song){
						preload_song = c_playlist[i];
					}
					if (i >= next_song){
						this.next_song = preload_song =  c_playlist[i];
						break
					}
				}
			};
			if (preload_song){
				this.next_preload_song = preload_song;
			}
		}	
	},
	checkAndFixNeighbours: function(){
		this.findNeighbours();
		this.addMarksToNeighbours();
	},
	deactivate: function(force){
		this.updateState('active', false);
		this.removeMarksFromNeighbours();
	},
	activate: function(force){
		this.updateState('active', true);
		this.checkAndFixNeighbours();

		
	},
	setVolume: function(vol){
		if (this.mopla && this.mopla.setVolume){
			this.mopla.setVolume(vol);
		}	
	},
	stop: function(){
		if (this.mopla && this.mopla.stop){
			this.mopla.stop();
		}
		//this.updateState('play', false);
	},
	switchPlay: function(){
		if (this.state('play')){
			if (this.state('play') == 'play'){
				this.pause();
			} else {
				this.play();
			}
		} else {
			this.play();
		}
	},
	pause: function(){
		if (this.mopla && this.mopla.pause){
			this.mopla.pause();
		}
		//this.updateState('play', 'paused');
		
	},
	play: function(mopla){
		if (!mopla && this.mopla && this.state('play') == 'pause'){
			this.mopla.play();
		} else if (this.isHaveTracks()){
			this.updateState('want_to_play', false);
			mopla = mopla || this.song();
			//fixme - fixable mopla
			mopla = mopla.getSongFileModel(this, this.player);

			if (mopla && ((this.mopla != mopla) || !this.state('play'))){

				if (this.mopla && this.mopla.stop){
					this.mopla.stop();
				}
				this.player.changeNowPlaying(this);
				this.findNeighbours();
				mopla.play();
				
				//this.updateState('play', 'play');
				this.updateProp('mopla', mopla);
				
			}
				
			
		}

	},
	markAs: function(neighbour){
		this.updateState('marked_as', neighbour);
	},
	unmark: function(){
		if (this.states.marked_as){
			this.updateState('marked_as', false);
		}
		
	},
	addMarksToNeighbours: function(){
		
		if (!this.marked_prev_song || this.marked_prev_song != this.prev_song){
			if (this.marked_prev_song){
				this.marked_prev_song.unmark();
			}
			if (this.prev_song){
				(this.marked_prev_song = this.prev_song).markAs('prev');
			}
		}
		if (!this.marked_next_song || this.marked_next_song != this.next_song){
			if (this.marked_next_song){
				this.marked_next_song.unmark();
			}
			if (this.next_song){
				(this.marked_next_song = this.next_song).markAs('next');
			}
		}
			
		
	},
	removeMarksFromNeighbours: function(){
		if (this.marked_prev_song){
			this.marked_prev_song.unmark();
			delete this.marked_prev_song;
		}
		if (this.marked_next_song){
			this.marked_next_song.unmark();
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
		lfm.get('artist.getTopTracks',{'artist': this.artist })
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'toptracks.track'))
				tracks = $filter(tracks, 'name');
				var some_track = tracks[Math.floor(Math.random()*tracks.length)];
				if (some_track){
					_this.updateProp('track', some_track);
					_this.findFiles({
						only_cache: !full_allowing,
						collect_for: from_collection,
						last_in_collection: last_in_collection
					});
				}
				
			})
			.always(function(){
				_this.updateState('loading', false);
			})
	},
	preloadSongFile: function(){
		if (this.isHaveBestTracks() && this.isSearchCompleted()){
			var mopla = this.song();
			mopla = mopla.getSongFileModel(this, this.player);
			mopla.load();
		}
	},
	prefindFiles: function(){
		this.findFiles({
			get_next: true
		});
		var _din = this.delayed_in;
		for (var i=0; i < _din.length; i++) {
			_din[i].setPrio('highest');
		}
	},
	findFiles: function(opts){
		if (this.mp3_search){
			opts = opts || {};
			opts.only_cache = opts.only_cache && !this.state('want_to_play') && (!this.player.c_song || this.player.c_song.next_preload_song != this)
			this.mp3_search.find_mp3(this, opts);
		}
	},
	makeSongPlayalbe: function(full_allowing,  from_collection, last_in_collection){
		if (this.raw()){
			this.updateState('playable', true);
		} else if (!this.track && this.getRandomTrackName){
			this.getRandomTrackName(full_allowing, from_collection, last_in_collection);
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
		this.fire('files_search', opts);
		this.updateState('files_search', opts);
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
	isHaveAnyResultsFrom: function(source_name){
		return !!this.raw() || !!this.sem && this.sem.isHaveAnyResultsFrom(source_name);
	},
	isNeedsAuth: function(service_name){
		return !this.raw() && this.mp3_search && (this.mp3_search.isNoMasterOfSlave(service_name) || !this.mp3_search.haveSearch(service_name));
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
	die: function(){
		if (this.ui){
			this.ui.die();
			delete this.ui;
		}
		
	},
	raw: function(){
		return this.omo && this.omo.raw;
	},
	valueOf:function(){
		return (this.artist ? this.artist + ' - ' : '') + this.track;
	},
	isNeighbour: function(mo){
		return (mo == this.prev_song) || (mo == this.next_song);
	},
	init: function(omo, player, mp3_search){
		servModel.prototype.init.call(this);
		this.mp3_search = mp3_search;
		this.player = player;
		this.states = {};
		this.uid = ++counter;
		cloneObj(this, omo, false, ['artist', 'track']);
		this.omo = omo;
	},
	setPlayableInfo: function(info){
		this.playable_info = info;
		return this;
	},
	render: function(complex){
		var v = this.getView();
		if (!v){
			this.addView(new songUI(this, complex));
		}
	}
};

cloneObj(baseSong.prototype, song_methods);
})();




