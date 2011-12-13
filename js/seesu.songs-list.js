(function(){
	songsList = function(playlist_title, playlist_type, info, first_song, findMp3, player){
		this.info = info || {};
		this.loading = true;
		if (playlist_title){
			this.playlist_title = playlist_title;
		}
		if (playlist_type){
			this.playlist_type = playlist_type;
		}
		this.player = player;
		this.findMp3 = findMp3;
		this.findSongOwnPosition(first_song);
		
	};
	songsList.prototype = new Array();
	var songs_list_methods = {
		oldpush: songsList.prototype.push,
		push: function(omo, view){
			var mo = extendSong(omo, this.player, this.findMp3);
			mo.delayed_in = [];
			mo.plst_titl = this;
			if (view){
				mo.render();
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
		getUrl: function(){
			var url ='';
			if (this.playlist_type == 'artist'){
				url += '/_';
			} else if (this.playlist_type == 'album'){
				url += '/' + this.info.album;
			} else if (this.playlist_type == 'similar artists'){
				url += '/+similar';
			} else if (this.playlist_type == 'artists by tag'){
				url += '/tags/' + this.info.tag;
			} else if (this.playlist_type == 'tracks'){
				url += '/ds';
			} else if (this.playlist_type == 'artists by recommendations'){
				url += '/recommendations';
			} else if (this.playlist_type == 'artists by loved'){
				url += '/loved';
			} else if (this.playlist_type == 'cplaylist'){
				url += '/playlist/' + this.info.name;
			} else if (this.playlist_type == 'chart'){
				url += '/chart/' +  this.info.country + '/' + this.info.metro;
			}
			return url;
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
		appendSongUI: function(mo){
			var pl_ui_element = mo.getC();
			if (!pl_ui_element){
				return
			}
			if (this.first_song){
				if (!this.firstsong_inseting_done){
					if (mo == this.first_song.mo){
						this.ui.tracks_container.append(pl_ui_element);
					} else{
						var moc = this.first_song.mo.getC();
						if (moc){
							moc.before(pl_ui_element);
						}
					}
				} else if (this.first_song.mo != mo){
					var f_position = this.indexOf(this.first_song.mo);
					var t_position = this.indexOf(mo);
					if (t_position < f_position){
						var moc = this.first_song.mo.getC();
						if (moc){
							moc.before(pl_ui_element);
						}
					} else{
						this.ui.tracks_container.append(pl_ui_element);
					}
				} else{
					this.ui.tracks_container.append(pl_ui_element);
				}
				
				
			} else{
				this.ui.tracks_container.append(pl_ui_element);
			}
		},
		render_playlist: function(load_finished) {
			var _this = this;	
			if (this.ui){
				var ui = this.ui.tracks_container;
				if (load_finished){
					this.ui.ready();
					this.loading = false;
				}
				
				if (!this.length){
					ui.append('<li>' + localize('nothing-found','Nothing found') + '</li>');
				} else {
					var from_collection = +new Date;
					
					
					if (this.player.c_song && this.player.c_song.plst_titl == this){
						
						var ordered = [];
						var etc = [];
						
						ordered.push(this.player.c_song);
						if (this.player.c_song.prev_song){
							ordered.push(this.player.c_song.prev_song);
						}
						if (this.player.c_song.next_song){
							ordered.push(this.player.c_song.next_song);
						}
						
						for (var i=0; i < this.length; i++) {
							var mo = pl[i];
							if (ordered.indexOf(mo) == -1){
								etc.push(mo);
							}
							
						};
						
						for (var i=0; i < this.length; i++) {
							this[i].render(from_collection, i == this.length-1, true);
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
						
						for (var i=0; i < this.length; i++) {
							this[i].render(from_collection, i == this.length-1);
						}
					}
					var actives_mo = $filter(this, 'states.active', true);
					for (var i = 0; i < actives_mo.length; i++) {
						actives_mo[i].checkAndFixNeighbours();
					};
				}
				return this.ui
			}

		},
		compare: function(puppet){
			var key_string_o = stringifyParams(this.info);
			var key_string_p = stringifyParams(puppet.info);
			
			return this.playlist_type == puppet.playlist_type && (key_string_o == key_string_p);
		},
		die: function(){
			if (this.ui){
				this.ui.remove();
				delete this.ui;
			}
			
			
			for (var i = this.length - 1; i >= 0; i--){
				this[i].die();
			};
			
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
					this[i].findFiles()
					viewSong(this[i], no_navi);
					
					return true;
				}
				
			};
			if (artist_track.artist && artist_track.track){
				this.add(artist_track, true);
				
			}
			
			return false;
			
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
		}
	};
	cloneObj(songsList.prototype, songs_list_methods);
})();