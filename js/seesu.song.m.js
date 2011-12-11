var song_methods = {
	state_change: {
		
	},
	getFullName: function(){
		var n = (this.artist || "") + ((this.artist && this.track) ?  ' - ' + this.track :  (this.track || ""))
		return n || 'no title'
	},
	view: function(no_navi){
		su.mp3_search.find_mp3(this);
		viewSong(this, no_navi);	
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
	stop: function(){
		if (this.mopla && this.mopla.stop){
			this.mopla.stop();
		}
		this.updateState('play', false);
	},
	switchPlay: function(){
		if (!this.state('play')){
			
		} else {
			this.play();
		}
	},
	play: function(mopla){
		if (mo.isHaveTracks()){
			delete this.want_to_play;
			mopla = mopla || mo.song();

			if (mopla && ((this.mopla != mopla) || !this.state('play'))){

				if (this.mopla && this.mopla.stop){
					this.mopla.stop();
				}
				if (this.mopla.play){
					this.mopla.play();
				} else{
					if (this.musicbox.play_song_by_url){
						this.musicbox.play_song_by_url(mopla.link);
						
					}
				}
				this.updateState('play', 'playing');
				this.updateProp('mopla', mopla);
				su.player.changeNowPlaying(this);
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
	makeSongPlayalbe: function(full_allowing,  from_collection, last_in_collection){
		if (this.raw()){
			this.updateState('playable', true);
		} else if (!this.track){
			start_random_nice_track_search(this, !full_allowing, from_collection, last_in_collection);
		} else{
			if (this.isSearchCompleted()){
				this.updateFilesSearchState(true)
			}
			su.mp3_search.find_mp3(this, {
				only_cache: !full_allowing && !this.want_to_play,
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
		var have_tracks = this.isHaveTracks();
		if (complete){
			this.updateState('searching-files', false);
			if (have_tracks){
				clearTimeout(this.cantwait);
				
				if (get_next){
					if (su.player.c_song && !su.player.c_song.load_finished) {
						if (this == su.player.c_song.next_song && su.player.musicbox.preloadSong){
							su.player.musicbox.preloadSong(su.player.c_song.next_song.song().link);
						} 
					}
				} else{
					wantSong(this);
				}
			} else{
				
				if (get_next){
					if (su.player.c_song) {
						if (this == su.player.c_song.next_song || this == su.player.c_song.prev_song || this == su.player.c_song.next_preload_song){
							su.player.c_song.checkAndFixNeighbours();
						}
						if (su.player.c_song.next_preload_song){
							get_next_track_with_priority(su.player.c_song.next_preload_song);
						}
					}
				}
			}
		} else if (this.isHaveBestTracks()){
			clearTimeout(this.cantwait);
			wantSong(this);
		} else if (have_tracks){
			this.cantwait = setTimeout(function(){
				wantSong(_this);
			},20000);
		}
		if (have_tracks){
			su.ui.els.export_playlist.addClass('can-be-used');

			this.updateState('playable', true);
		}

		this.updateState('files_search', {complete: complete, have_tracks: have_tracks, have_best_tracks: this.isHaveBestTracks()});
	},
	render: function(from_collection, last_in_collection, complex){
		
		var pl = this.plst_titl;
		this.playable_info = {
			packsearch: from_collection,
			last_in_collection: last_in_collection
		};
		if (pl && pl.ui && pl.ui.tracks_container){
			var con = this.getC();
			if (!con || con[0].ownerDocument != su.ui.d){
				this.addView(new songUI(this, complex))
				pl.appendSongUI(this);
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
	getSongFileModel: function(file){
			
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
	}
};

(function(){
	var counter = 0;
	
	song = function(omo){
		this.init();
		this.states = {};
		this.uid = ++counter;
		cloneObj(this, omo, false, ['artist', 'track']);
		this.omo = omo;
	};
	song.prototype = new servModel();

	cloneObj(song.prototype, song_methods);
	//song.prototype = song_methods;
})();




var extendSong = function(omo){
	if (!(omo instanceof song)){
		return new song(omo);
	} else{
		return omo;
	}
};

