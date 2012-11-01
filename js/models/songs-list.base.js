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
			var _this = this;
			this.on('request', function() {
				_this.checkRequestsPriority();
			});
			
		},
		push: function(omo, skip_changes){
			var mo = this.extendSong(omo, this.player, this.findMp3);

			var last_usable_song = this.getLastUsableSong();

			if (this.first_song){
				if (this.first_song==mo){
					this.palist.push(mo);
				} else if (!this.firstsong_inseting_done){
					if (mo.artist != this.first_song.artist || mo.track != this.first_song.track){
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
			this.setChild('song', this.palist);
			if (!skip_changes){
				if (this.onChanges){
					this.onChanges(last_usable_song);
				}
				
			}
			return mo;
		},
		add: function(omo){
			var mo = cloneObj({}, omo, false, ['track', 'artist']);
			return this.push(mo);
		},
		findSongOwnPosition: function(first_song){
			var can_find_context;

			if (bN(['artist', 'album', 'cplaylist'].indexOf(this.playlist_type ))){
				can_find_context = true;
			}
			
			this.firstsong_inseting_done = !can_find_context;
			
			if (first_song && first_song.track && first_song.artist){
				this.first_song = this.extendSong(first_song, this.player, this.findMp3);;
			}
			if (this.first_song){
				this.push(this.first_song);
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
				if (!this.song_request_info || this.song_request_info.done){
					this.loading();
					this.song_request_info = this.requestMoreSongs.call(this, this.getPagingInfo());
					if (!this.song_request_info.request){
						throw new Error('give me request');
					} else {
						this.addRequest(this.song_request_info.request);
					}
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
				npl[i] = npl[i].simplify();
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
			this.setChild('song', this.palist, true);
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
				//this.checkNeighboursChanges(last_usable_song);
			}
			var w_song = this.getWantedSong();
			var v_song = this.getViewingSong(w_song);
			var p_song = this.getPlayerSong(v_song);
			if (w_song && !w_song.hasNextSong()){
				this.checkNeighboursChanges(w_song, false, false, "playlist load");
			}
			if (v_song && !v_song.hasNextSong()) {
				this.checkNeighboursChanges(v_song, false, false, "playlist load");
			}
			
			if (p_song && v_song != p_song && !p_song.hasNextSong()){
				this.checkNeighboursChanges(p_song, false, false, "playlist load");
			}
			this.trigger('palist-change', this.palist);
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
		setWaitingNextSong: function(mo) {
			this.waiting_next = mo;
			var _this = this;
			this.player.once('now-playing-signal', function() {
				if (_this.waiting_next == mo){
					delete _this.waiting_next;
				}
			});
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
					var next_preload_song = mo.next_preload_song;
					var can_repeat = !this.state('dont-rept-pl');
					if (next_preload_song){
						var real_cur_pos = this.palist.indexOf(mo);
						var nps_pos = this.palist.indexOf(next_preload_song);
						if (can_repeat || nps_pos > real_cur_pos){
							if (next_preload_song.canPlay()){
								s = next_preload_song;
							} else {
								this.setWaitingNextSong(mo);
								next_preload_song.makeSongPlayalbe(true);
							}
						}
						
					} else if (this.state('can-load-more')){
						this.setWaitingNextSong(mo);

					} else {
						if (current_number == (total-1)) {
							if (can_repeat){
								s = playlist[0];
							}
							
						} else {
							s = playlist[current_number+1];
						}
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
		getWantedSong: function() {
			return $filter(this.palist, 'states.want_to_play', function(v) {return !!v;})[0];
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
		},
		getNeighboursChanges: function(target_song, to_check) {
			var
				check_list = {},
				need_list = {},
				ste_diff = {},
				n_ste = {},
				o_ste = {
					next_song: target_song.next_song,
					prev_song: target_song.prev_song,
					next_preload_song: target_song.next_preload_song
				};

			for (var i in o_ste){
				check_list[i] = !to_check || (o_ste[i] == to_check);
			}

			cloneObj(n_ste, o_ste);

			var fastCheck = function(neighbour_name){
				if (o_ste[neighbour_name]){
					n_ste[neighbour_name] = o_ste[neighbour_name] && o_ste[neighbour_name].canUseAsNeighbour() && o_ste[neighbour_name]; 
				}
				need_list[neighbour_name] = !n_ste[neighbour_name];
			};

			for (var i in check_list){
				if (check_list[i]){
					fastCheck(i);
				}
			}

			var changes = this.getNeighbours(target_song, need_list);

			cloneObj(n_ste, changes);


			return getDiffObj(o_ste, n_ste);
		},
		checkNeighboursChanges: function(target_song, changed_neighbour, viewing, log) {
			var changes = this.getNeighboursChanges(target_song, changed_neighbour)
			//console.log("changes");
			//console.log();
			cloneObj(target_song, changes)

			//this.findNeighbours();

			viewing = viewing || !!target_song.state("mp-show");
			var playing = !!target_song.state("player-song");
			var wanted = target_song.state('want_to_play')

			if (viewing){
				target_song.addMarksToNeighbours();
				if (changes.prev_song && !changes.prev_song.track){
					changes.prev_song.getRandomTrackName();
				}
				
			}
			if ((viewing || playing) && changes.next_preload_song){
				changes.next_preload_song.makeSongPlayalbe(true);
			}
			if (!target_song.cncco){
				target_song.cncco = [];
			} else {
				target_song.cncco.push(log);
			}

			if (viewing || playing || wanted){
				if (!target_song.hasNextSong()){
					this.loadMoreSongs();
				}
			}

		},
		checkChangesSinceFS: function(target_song, opts) {
			if (target_song.isImportant()){
				if (!opts || (opts.complete || opts.have_best_tracks)){
					this.checkNeighboursChanges(target_song, false, false, 'important; files search');
					
				}
			} 

			if (!opts || opts.complete){
				var v_song = this.getViewingSong(target_song);
				var p_song = this.getPlayerSong(target_song);
				
				if (v_song && v_song.isPossibleNeighbour(target_song)) {
					
					this.checkNeighboursChanges(v_song, target_song, false, "nieghbour of viewing song; files search");
				}
				
				if (p_song && v_song != p_song && p_song.isPossibleNeighbour(target_song)){
					this.checkNeighboursChanges(p_song, target_song, false, "nieghbour of playing song; files search");
				}
			}
			if (this.waiting_next){
				if (!this.waiting_next.next_preload_song){
					delete this.waiting_next;
				} else {
					if (this.waiting_next.next_preload_song.canPlay()){
						this.player.wantSong(this.waiting_next.next_preload_song);
						
						//this.waiting_next.next_preload_song.play();
						//delete this.waiting_next;
					}
					
				}
			}
		},
		checkRequestsPriority: function() {
			var common = [];
			var demonstration = [];

			var w_song = this.getWantedSong();
			var waiting_next = this.waiting_next;
			var v_song = this.getViewingSong();
			var p_song = this.getPlayerSong();


			var addToArray = function(arr, item) {
				if (arr.indexOf(item) == -1){
					arr.push(item);
					return true;
				}
			};
			if (w_song){
				addToArray(common, w_song);
			}

			if (waiting_next){
				if (waiting_next.next_song){
					addToArray(common, waiting_next.next_song);
				} else if (this.state('can-load-more')){
					addToArray(common, this);
				} else if (waiting_next.next_preload_song){
					addToArray(common, waiting_next.next_preload_song);
					
				} 
				addToArray(common, waiting_next);
			
			}
			if (v_song){
				if (v_song.next_song){
					addToArray(common, v_song.next_song);
				} else if (this.state('can-load-more')){
					addToArray(common, this);
				} else if (v_song.next_preload_song){
					addToArray(common, v_song.next_preload_song);
					
				} 
				addToArray(common, v_song);
			}
			if (p_song){
				if (p_song.next_song){
					addToArray(common, p_song.next_song);
				} else if (this.state('can-load-more')){
					addToArray(common, this);
				} else if (p_song.next_preload_song){
					addToArray(common, p_song.next_preload_song);
					
				} 
				addToArray(common, p_song);
			}
			if (v_song && v_song.prev_song){
				addToArray(common, v_song.prev_song);
			}

			
			
			if (v_song){
				addToArray(demonstration, v_song);
				if (v_song.next_song){
					addToArray(demonstration, v_song.next_song);
				} else if (this.state('can-load-more')){
					addToArray(demonstration, this);
				}
				if (v_song.prev_song){
					addToArray(demonstration, v_song.prev_song);
				}
			}
			if (p_song){
				addToArray(demonstration, p_song);

				if (p_song.next_song){
					addToArray(demonstration, p_song.next_song);
				}
			}
			if (waiting_next){
				addToArray(demonstration, waiting_next);
				if (waiting_next.next_song){
					addToArray(demonstration, waiting_next.next_song);
				}
			}

			demonstration.reverse();
			common.reverse();
			
			for (var i = 0; i < demonstration.length; i++) {
				demonstration[i].setPrio('highest', 'demonstration');
			}
			for (var i = 0; i < common.length; i++) {
				common[i].setPrio('highest', 'common');
			}
			
		}

	});
	
	

})();