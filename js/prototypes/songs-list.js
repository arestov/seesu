(function(){
	songsListModel = function(){};
	songsListModel.prototype = new Array();
	cloneObj(songsListModel.prototype, mapLevelModel.prototype);
	cloneObj(songsListModel.prototype, {
		oldpush: songsListModel.prototype.push,
		constructor: songsListModel,
		init: function(){
			mapLevelModel.prototype.init.call(this)
		},
		push: function(omo, view){
			var mo = this.extendSong(omo, this.player, this.findMp3);
			mo.delayed_in = [];
			mo.plst_titl = this;
			if (view){
				mo.render(true);
				mo.view();
			}

			if (this.first_song){
				if (this.first_song.omo==omo){
					this.first_song.mo = mo;
					return this.oldpush(mo);
				} else if (!this.firstsong_inseting_done){
					if (mo.artist != this.first_song.omo.artist || mo.track != this.first_song.omo.track){
						var fs = this.pop();
						this.oldpush(mo);
						return this.oldpush(fs);
						
					} else {
						this.firstsong_inseting_done = true;
					}
					
				} else{
					return this.oldpush(mo);
				}
			} else {
				return this.oldpush(mo);
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
			for (var i = this.length - 1; i >= 0; i--){
				this[i].die();
			};
		},
		compare: function(puppet){
			var key_string_o = stringifyParams(this.info);
			var key_string_p = stringifyParams(puppet.info);
			
			return this.playlist_type == puppet.playlist_type && (key_string_o == key_string_p);
		},
		simplify: function(){
			var npl = this.slice();
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
			if (bN(this.indexOf(mo))){
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
			
			for (var i=0; i < this.length; i++) {
				if (artist_track.track == this[i].track && (will_ignore_artist || artist_track.artist == this[i].artist)){
					this[i].findFiles();
					this[i].view(no_navi);
					return true;
				}
			};
			if (artist_track.artist && artist_track.track){
				this.add(artist_track, true);
				
			}
			
			return this;
			
		},
		loading: function(){
			this.updateState('loading', true);
			return this;
		},
		changed: function(){
			this.updateState('changed', 'ta' + Math.random() + new Date());
			return this;
		},
		loadComplete: function(error){
			error = ((typeof error == 'string') ? error : (!this.length && error));
			this.updateState('error', error);
			this.updateState('loading', false);
			this.markTracksForFilesPrefinding();
			if (!error){
				this.changed();
			}
			
			return this;

		},
		markTracksForFilesPrefinding: function(){
			var from_collection = +new Date;
			for (var i=0; i < this.length; i++) {
				this[i]
					.setPlayableInfo({
						packsearch: from_collection,
						last_in_collection: i == this.length-1
					})
			};
			return this;
		}


	});


	songsListViewBase = function(){};
	songsListViewBase.prototype = new servView(); 
	cloneObj(songsListViewBase.prototype, {
		constructor: songsListViewBase,
		init: function(pl){
			servView.prototype.init.call(this);
			this.createBase();
			this.setModel(pl);
			
		},
		state_change: {
			loading: function(loading){
				if (loading){
					this.c.addClass('loading');
				} else {
					this.c.removeClass('loading');
				}
			},
			changed: function(){
				this.render_playlist();
			}
		},
		createBase: function() {
			this.c = $('<ul class="tracks-c current-tracks-c tracks-for-play"></ul>');	
		},
		appendSongUI: function(mo){
			var pl_ui_element = mo.getC();
			if (!pl_ui_element){
				return
			}
			var _this = this.mdl;

			if (_this.first_song){
				if (!_this.firstsong_inseting_done){
					if (mo == _this.first_song.mo){
						this.c.append(pl_ui_element);
					} else{
						var moc = _this.first_song.mo.getC();
						if (moc){
							moc.before(pl_ui_element);
						}
					}
				} else if (_this.first_song.mo != mo){
					var f_position = _this.indexOf(_this.first_song.mo);
					var t_position = _this.indexOf(mo);
					if (t_position < f_position){
						var moc = _this.first_song.mo.getC();
						if (moc){
							moc.before(pl_ui_element);
						}
					} else{
						this.c.append(pl_ui_element);
					}
				} else{
					this.c.append(pl_ui_element);
				}
				
				
			} else{
				this.c.append(pl_ui_element);
			}
		},
		render_playlist: function(load_finished) {
			var _this = this.mdl;	
			if (_this.length){
				if (_this.player && _this.player.isPlaying(_this)){
					var ordered = [];
					var etc = [];

					var current_song = _this.player && _this.player.c_song;
					if (current_song) {
						for (var i = 0; i < _this.length; i++) {
							if (current_song.isNeighbour(_this[i])){
								ordered.push(_this[i]);
							}
						};
					}
					
					for (var i=0; i < _this.length; i++) {
						var mo = _this[i];
						if (ordered.indexOf(mo) == -1){
							etc.push(mo);
						}
						
					};
					
					for (var i=0; i < _this.length; i++) {
						_this[i].render();
						this.appendSongUI(_this[i]);

						
					}
					for (var i=0; i < ordered.length; i++) {
						if (ordered[i].ui){
							ordered[i].ui.expand()
						} else{}
					};
					
					setTimeout(function(){
						for (var i=0; i < etc.length; i++) {
							if (etc[i].ui){
								etc[i].ui.expand()
							} else{}
						};
					},1000);
				} else{
					for (var i=0; i < _this.length; i++) {
						_this[i].render(true);
						this.appendSongUI(_this[i]);
					}
				}
				var actives_mo = $filter(_this, 'states.active', true);
				for (var i = 0; i < actives_mo.length; i++) {
					actives_mo[i].checkAndFixNeighbours();
				};
			}
		}
	});

})();	