var songsList;
(function(){
	"use strict";
	
	provoda.addPrototype("songsListBase", {
		model_name: "playlist",
		complex_states: {
			more_load_available: {
				depends_on: ["can-load-more", "loading"],
				fn: function(can_load_more, loading) {
					if (can_load_more){
						return !loading;
					} else {

					}
				}
			}
		},
		init: function(){
			this.palist = [];
			this._super();
		},
		push: function(omo, skip_changes){
			var mo = this.extendSong(omo, this.player, this.findMp3);

			var last_usable_song = this.getLastUsableSong();

			if (this.first_song){
				if (this.first_song.omo==omo){
					this.first_song.mo = mo;
					this.palist.push(mo);
				} else if (!this.firstsong_inseting_done){
					if (mo.artist != this.first_song.omo.artist || mo.track != this.first_song.omo.track){
						var fs = this.palist.pop();
						this.palist.push(mo);
						this.palist.push(fs);
					} else {
						this.firstsong_inseting_done = true;
					}
					
				} else{
					this.palist.push(mo);
				}
			} else {
				this.palist.push(mo);
			}
			this.setChildren('song', this.palist);
			if (!skip_changes){
				if (this.onChanges){
					this.onChanges(last_usable_song);
				}
				
			}
		},
		add: function(omo){
			var mo = cloneObj({}, omo, false, ['track', 'artist']);
			this.push(mo);
		},
		findSongOwnPosition: function(first_song){
			var can_find_context;
			if (bN(['artist', 'album', 'cplaylist'].indexOf(this.playlist_type ))){
				can_find_context = true;
			}
			
			this.firstsong_inseting_done = !can_find_context;
			
			if (first_song && first_song.track && first_song.artist){
				this.first_song = {
					omo: first_song
				};
			}
			if (this.first_song){
				this.push(this.first_song.omo);
			}
		},
		getPagingInfo: function() {
			var length = this.getLength();
			if (length && this.first_song && !this.firstsong_inseting_done){
				--length;
			}
			var has_pages = Math.floor(length/this.page_limit);
			var remainder = length % this.page_limit;
			var next_page = has_pages + 1;

			return {
				current_length: length,
				has_pages: has_pages,
				page_limit: this.page_limit,
				remainder: remainder,
				next_page: next_page
			};
		},
		page_limit: 30,
		getLength: function() {
			return this.palist.length;
		},
		getLastSong: function(){
			return this.palist.length ? this.palist[this.palist.length - 1] : false;
		},
		setLoaderFinish: function() {
			this.updateState("can-load-more", false);
		},
		setLoader: function(cb, trigger) {
			this.updateState("can-load-more", true);
			this.requestMoreSongs = cb;

			//this.on("load-more", cb);
			if (trigger){
				this.loadMoreSongs()
			}

		},
		loadMoreSongs: function(force) {
			if (this.state("can-load-more") && this.requestMoreSongs){
				if (!this.song_request || this.song_request.done){
					this.loading();
					this.song_request = this.requestMoreSongs.call(this, this.getPagingInfo());
				}
				
				
				//this.trigger("load-more");
			}
			
		},
		die: function(){
			this.hide();
			this._super();
			for (var i = this.palist.length - 1; i >= 0; i--){
				this.palist[i].die();
			}

		},
		compare: function(puppet){
			var key_string_o = stringifyParams(this.info);
			var key_string_p = stringifyParams(puppet.info);
			
			return this.playlist_type == puppet.playlist_type && (key_string_o == key_string_p);
		},
		simplify: function(){
			var npl = this.palist.slice();
			for (var i=0; i < npl.length; i++) {
				npl[i] = cloneObj({}, npl[i], false, ['track', 'artist']);
			}
			npl = cloneObj({
				length: npl.length,
				playlist_title: this.playlist_title,
				playlist_type: this.playlist_type
			}, npl);
			
			
			return npl;
		},
		belongsToArtist: function(v){
			return !!(this.info && this.info.artist) && (!v || this.info.artist == v);
		},
		showExactlyTrack: function(mo, no_navi){
			if (bN(this.palist.indexOf(mo))){
				mo.view(no_navi);
				return true;
			}
		},
		showTrack: function(artist_track, no_navi){
			var will_ignore_artist;
			var artist_match_playlist = this.playlist_type == 'artist' && this.info.artist == artist_track.artist;
			if (!artist_track.artist || artist_match_playlist){
				will_ignore_artist = true;
			}
			
			
			
			for (var i=0; i < this.palist.length; i++) {
				if (artist_track.track == this.palist[i].track && (will_ignore_artist || artist_track.artist == this.palist[i].artist)){
					this.palist[i].view(no_navi);
					return true;
				}
			}
			if (artist_track.artist && artist_track.track){
				this.add(artist_track, true);
				
			}
			
			return this;
			
		},
		markAsPlayable: function() {
			this.updateState('can-play', true);
		},
		loading: function(){
			this.updateState('loading', true);
			return this;
		},
		changed: function(){
			this.setChildren('song', this.palist, true);
			return this;
		},
		injectExpectedSongs: function(playlist) {
			var song;
			if (playlist && playlist.length){
				song = this.getLastUsableSong();

				for (var i=0, l = playlist.length; i < l; i++) {
					this.push(playlist[i], true);
				}
				
			}
			this.loadComplete(!playlist || !playlist.length);
			if (this.onChanges){
				this.onChanges(song);
			}
			return this;
		},
		onChanges: function(last_usable_song){
			if (last_usable_song && last_usable_song.isImportant()){
				//last_usable_song.checkNeighboursChanges();
			}
			var v_song = this.getViewingSong();
			var p_song = this.getPlayerSong();

			if (v_song && !v_song.hasNextSong()) {
				v_song.checkNeighboursChanges(false, false, "playlist load");
			}
			
			if (p_song && v_song != p_song && !p_song.hasNextSong()){
				p_song.checkNeighboursChanges(false, false, "playlist load");
			}
		},
		loadComplete: function(error){
			error = ((typeof error == 'string') ? error : (!this.palist.length && error));
			this.updateState('error', error);
			this.updateState('loading', false);
			this.markTracksForFilesPrefinding();

			var _this = this;
			setTimeout(function() {
				_this.makePlayable();
			},300);
			if (!error){
				this.changed();
			}
			return this;
		},
		makePlayable: function(full_allowing) {
			for (var i = 0; i < this.palist.length; i++) {
				var mo = this.palist[i];
				var pi = mo.playable_info || {};
				mo.makeSongPlayalbe(pi.full_allowing || full_allowing, pi.packsearch, pi.last_in_collection);
				mo.setPrio('as-top');
			}
		},
		markTracksForFilesPrefinding: function(){
			var from_collection = + (new Date());
			for (var i=0; i < this.palist.length; i++) {
				this.palist[i]
					.setPlayableInfo({
						packsearch: from_collection,
						last_in_collection: i == this.palist.length-1
					});
				
			}
			return this;
		},
		switchTo: function(mo, direction, auto) {
	
			var playlist = [];
			for (var i=0; i < this.palist.length; i++) {
				var ts = this.palist[i].canPlay();
				if (ts){
					playlist.push(this.palist[i]);
				}
			}
			var current_number  = playlist.indexOf(mo),
				total			= playlist.length || 0;
				
			if (playlist.length > 1) {
				var s = false;
				if (direction) {
					if (current_number == (total-1)) {
						if (!this.state('dont-rept-pl')){
							s = playlist[0];
						}
						
					} else {
						s = playlist[current_number+1];
					}
				} else {
					if ( current_number == 0 ) {
						s = playlist[total-1];
					} else {
						s = playlist[current_number-1];
					}
				}
				if (s){
					s.play();
				}
			} else if (playlist[0]){
				playlist[0].play();
			}
		
		},
		getViewingSong: function(exept) {
			var song = $filter(this.palist, 'states.mp-show', function(v) {return !!v;})[0]
			return song != exept && song ;
		},
		getPlayerSong: function(exept) {
			var song = $filter(this.palist, "states.player-song", true)[0];
			return song != exept && song;
		},
		getLastUsableSong: function(){
			for (var i = this.palist.length - 1; i >= 0; i--) {
				var cur = this.palist[i];
				if (cur.canUseAsNeighbour()){
					return cur;
				}
				
			};
		},
		getNeighbours: function(mo, neitypes){
			var obj = {};
			var c_num = this.palist.indexOf(mo);

			if (neitypes.prev_song){
				for (var i = c_num - 1; i >= 0; i--) {
					if (this.palist[i].canUseAsNeighbour()){
						obj.prev_song = this.palist[i];
						break;
					}
				}
			}

			if (neitypes.next_song){
				for (var i = c_num + 1; i < this.palist.length; i++) {
					if (this.palist[i].canUseAsNeighbour()){
						obj.next_song = obj.next_preload_song = this.palist[i];
						break;
					}
				}
			}
			if (neitypes.next_preload_song && !obj.next_preload_song){
				for (var i = 0; i < c_num; i++) {
					if (this.palist[i].canUseAsNeighbour()){
						obj.next_preload_song = this.palist[i];
						break;
					}
				}
			}
			return obj;

		},
		findNeighbours: function(mo) {

			mo.next_song = false;
			mo.prev_song = false;
			mo.next_preload_song = false;

			var changes = this.getNeighbours(mo, {
				next_song: true,
				prev_song: true,
				next_preload_song: true
			});
			cloneObj(mo, changes);
		}


	});
	
	

})();