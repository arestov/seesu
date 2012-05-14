(function(){
	songsListModel = function(){};
	suMapModel.extendTo(songsListModel, {
		init: function(){
			this.palist = []; 
			this._super();
		},
		push: function(omo, view){
			var mo = this.extendSong(omo, this.player, this.findMp3);
			mo.plst_titl = this;
			if (view){
				mo.render(true);
				mo.view();
			}

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
		},
		add: function(omo, view){
			var mo = cloneObj({}, omo, false, ['track', 'artist']);
			this.push(mo, view);
		},
		findSongOwnPosition: function(first_song){
			if (bN(['artist', 'album', 'cplaylist'].indexOf(this.playlist_type ))){
				var can_find_context = true;
			}
			
			this.firstsong_inseting_done = !can_find_context;
			
			if (first_song && first_song.track && first_song.artist){
				this.first_song = {
					omo: first_song
				};
			}
			if (this.first_song){
				this.push(this.first_song.omo)
			}
		},
		die: function(){
			this.hide();
			this._super();
			for (var i = this.palist.length - 1; i >= 0; i--){
				this.palist[i].die();
			};

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
			};
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
			
			
			console.log('want to find and show');
			
			for (var i=0; i < this.palist.length; i++) {
				if (artist_track.track == this.palist[i].track && (will_ignore_artist || artist_track.artist == this.palist[i].artist)){
					this.palist[i].view(no_navi);
					return true;
				}
			};
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
			this.updateState('changed', 'ta' + Math.random() + new Date());
			return this;
		},
		injectExpectedSongs: function(playlist) {
			if (playlist){
				for (var i=0, l = playlist.length; i < l; i++) {
					this.push(playlist[i]);
				}
			}
			this.loadComplete(!playlist || !playlist.length);
			return this;
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
			};
		},
		markTracksForFilesPrefinding: function(){
			var from_collection = +new Date;
			for (var i=0; i < this.palist.length; i++) {
				this.palist[i]
					.setPlayableInfo({
						packsearch: from_collection,
						last_in_collection: i == this.palist.length-1
					});
				
			};
			return this;
		},
		switchTo: function(mo, direction, auto) {
	
			var playlist = [];
			for (var i=0; i < this.palist.length; i++) {
				var ts = this.palist[i].song();
				if (ts){
					playlist.push(this.palist[i]);
				}
			};
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
			}
		
		},
		findNeighbours: function(mo) {
			//using for visual markering and determination of what to presearch
			mo.next_preload_song = false;
			mo.next_song = false
			mo.prev_song = false
			
			var c_num = this.palist.indexOf(mo);//this.play_order

			var can_use = [];
			for (var i=0; i < this.palist.length; i++) {
				var cur = this.palist[i];
				if (cur && (cur.isHaveTracks('mp3') || (cur.canSearchFiles() && !cur.isSearchCompleted()))){
					can_use.push(i);
				}
			};	
			if (typeof c_num == 'number'){
				if (c_num-1 >= 0) {
					for (var i = c_num-1, _p = false;  i >= 0; i--){
						
						if (bN(can_use.indexOf(i))){
							mo.prev_song = this.palist[i];
							break
						}
					};
				}
				var next_song = c_num+1;
				var preload_song;
				for (var i = 0, _n = false; i < this.palist.length ; i++) {
					if (bN(can_use.indexOf(i))){
						if (!preload_song){
							preload_song = this.palist[i];
						}
						if (i >= next_song){
							mo.next_song = preload_song =  this.palist[i];
							break
						}
					}
				};
				if (preload_song){
					mo.next_preload_song = preload_song;
				}
			}	
		}


	});
	

	songsListViewBase = function(){};
	suServView.extendTo(songsListViewBase, {
		constructor: songsListViewBase,
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
		createC: function() {
			this.c = $('<div class="playlist-container"></div>');

			var pl_panel = su.ui.samples.playlist_panel.clone();


			var _this = this;

			pl_panel.find(".make-trs-plable").click(function(){
				_this.md.makePlayable(true);
				su.track_event('Controls', 'make playable all tracks in playlist'); 
			})
			
			this.export_playlist = pl_panel.find('.open-external-playlist').click(function(e){
				_this.md.makeExternalPlaylist()
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
			var pl_ui_element = mo.getFreeView();
				pl_ui_element = pl_ui_element && pl_ui_element.getC();
			if (!pl_ui_element){
				return
			}
			var _this = this.md;


			if (_this.first_song){
				if (!_this.firstsong_inseting_done){
					if (mo == _this.first_song.mo){
						this.lc.append(pl_ui_element);
					} else{
						var moc = _this.first_song.mo.getC();
						if (moc){
							moc.before(pl_ui_element);
						}
					}
				} else if (_this.first_song.mo != mo){
					var f_position = _this.palist.indexOf(_this.first_song.mo);
					var t_position = _this.palist.indexOf(mo);
					if (t_position < f_position){
						var moc = _this.first_song.mo.getC();
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
			
				var actives_mo = $filter(_this.palist, 'states.mp-show', function(v) {return !!v});
				for (var i = 0; i < actives_mo.length; i++) {
					actives_mo[i].checkAndFixNeighbours();
				};
			}
		}
	});

})();	