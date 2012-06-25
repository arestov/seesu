var songsList;
(function(){
	"use strict";
	
	provoda.addPrototype("songsListBase", {
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
			mo.plst_titl = this;

			var last_song = this.getLastSong();

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
			if (!skip_changes && this.onChanges){
				this.onChanges(last_song);
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
			this.on("load-more", cb);
			if (trigger){
				this.loadMoreSongs()
			}

		},
		loadMoreSongs: function(force) {
			this.trigger("load-more");
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
			this.updateState('changed', 'ta' + Math.random() + (+ new Date()));
			return this;
		},
		injectExpectedSongs: function(playlist) {
			var song;
			if (playlist && playlist.length){
				song = this.getLastSong();

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
		onChanges: function(ending_song){
			if (ending_song && ending_song.isImportant()){
				ending_song.checkNeighboursChanges();

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
						s = playlist[0];
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
		findNeighbours: function(mo) {

			

			var c_num = this.palist.indexOf(mo);
			var canUse = function(song) {
				
			};

			mo.next_song = false;
			mo.prev_song = false;
			mo.next_preload_song = false;
			
			for (var i = c_num - 1; i >= 0; i--) {
				if (this.palist[i].canUseAsNeighbour()){
					mo.prev_song = this.palist[i];
					break;
				}
			}

			for (var i = c_num + 1; i < this.palist.length; i++) {
				if (this.palist[i].canUseAsNeighbour()){
					mo.next_song = mo.next_preload_song = this.palist[i];
					break;
				}
			}
			if (!mo.next_preload_song){
				for (var i = 0; i < c_num; i++) {
					if (this.palist[i].canUseAsNeighbour()){
						mo.next_preload_song = this.palist[i];
						break;
					}
				}
			}


		}


	});
	
	provoda.addPrototype("songsListBaseView", {
		init: function(pl){
			this._super();
			this.createBase();
			this.setModel(pl);
			
		},
		state_change: {
			loading: function(loading){
				if (loading){
					this.lc.addClass('loading');
				} else {
					this.lc.removeClass('loading');
				}
			},
			"more_load_available": function(state) {
				
				if (state){
					this.requirePart("load-more-b").removeClass("hidden");
				} else {
					var button = this.getPart("load-more-b");
					if (button){
						button.addClass("hidden");
					}
				}
			},
			changed: function(){
				this.render_playlist();
			},
			"can-play": function(state) {
				if (state){
					//make-trs-plable
					this.export_playlist.addClass('can-be-used');
				} else {
					this.export_playlist.removeClass('can-be-used');
				}
			}
		},
		parts_builder: {
			"load-more-b": function() {
				var _this = this;
				return $("<a class='load-more-songs'></a>").click(function() {
						_this.md.loadMoreSongs(true);
					}).text("загрузить больше").appendTo(this.c);
			}
		},
		createC: function() {
			this.c = $('<div class="playlist-container"></div>');

			var pl_panel = su.ui.samples.playlist_panel.clone();


			var _this = this;

			pl_panel.find(".make-trs-plable").click(function(){
				_this.md.makePlayable(true);
				su.track_event('Controls', 'make playable all tracks in playlist');
			});
			
			this.export_playlist = pl_panel.find('.open-external-playlist').click(function(e){
				_this.md.makeExternalPlaylist();
				e.preventDefault();
			});
			this.c.append(pl_panel);
			
			return this;
		},
		createBase: function() {
			this.createC();
			this.lc = $('<ul class="tracks-c current-tracks-c tracks-for-play"></ul>').appendTo(this.c);
		},
		appendSongUI: function(mo){
			var moc;
			var pl_ui_element = mo.getFreeView();
				pl_ui_element = pl_ui_element && pl_ui_element.getC();
			if (!pl_ui_element){
				return;
			}
			var _this = this.md;


			if (_this.first_song){
				if (!_this.firstsong_inseting_done){
					if (mo == _this.first_song.mo){
						this.lc.append(pl_ui_element);
					} else{
						moc = _this.first_song.mo.getC();
						if (moc){
							moc.before(pl_ui_element);
						}
					}
				} else if (_this.first_song.mo != mo){
					var f_position = _this.palist.indexOf(_this.first_song.mo);
					var t_position = _this.palist.indexOf(mo);
					if (t_position < f_position){
						moc = _this.first_song.mo.getC();
						if (moc){
							moc.before(pl_ui_element);
						}
					} else{
						this.lc.append(pl_ui_element);
					}
				} else{
					this.lc.append(pl_ui_element);
				}
				
				
			} else{
				this.lc.append(pl_ui_element);
			}
		},
		render_playlist: function(load_finished) {
			var _this = this.md;
			if (_this.palist.length){
			
				for (var i=0; i < _this.palist.length; i++) {
					this.appendSongUI(_this.palist[i]);
				}
			
				var v_song = this.md.getViewingSong();
				if (v_song){
					v_song.checkAndFixNeighbours();
				}
			}
		}
	});

})();