var playerComplex = function(){};
playerComplex.prototype = new playerBase();
cloneObj(playerComplex.prototype, {
	constructor: playerComplex,
	playNext: function(mo, auto){
		this.switchTo(mo, true, auto);
	},
	playPrev: function(mo){
		this.switchTo(mo)
	},
	switchTo: function(mo, direction, auto) {
		var c_song = mo || this.c_song;
		if (c_song) {
			var playlist = [];
			for (var i=0; i < c_song.plst_titl.length; i++) {
				var ts = c_song.plst_titl[i].song();
				if (ts){
					playlist.push(c_song.plst_titl[i]);
				}
			};
			var current_number  = playlist.indexOf(c_song),
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
					if ( current_number == 0) {
						s = playlist[total-1];
					} else {
						s = playlist[current_number-1];
					}
				}
				if (s){
					s.play();
				}
			}
		}
	},
	removeCurrentWantedSong: function(){
		if (this.wanted_song){
			this.wanted_song.updateState('want_to_play', false);
			delete this.wanted_song
		}
	},
	wantSong: function(mo){
		var _this = this;
		if (this.wanted_song !== mo){
			this.removeCurrentWantedSong();
			(this.wanted_song = mo).updateState('want_to_play', true);
			var delayed_in = mo.delayed_in;
			for (var i=0; i < delayed_in.length; i++) {
				delayed_in[i].setPrio('highest');
			}

			var opts = mo.state('files_search');
			if (opts && ((opts.complete && opts.have_tracks) || opts.have_best_tracks)){
				mo.play();
			} else {
				var filesSearch = function(opts){
					if (_this.wanted_song == mo){
						if (opts.complete || opts.have_best_tracks){
							clearTimeout(mo.cantwait_toplay);
							mo.play()
						} else if (!mo.cantwait_toplay){
							mo.cantwait_toplay = setTimeout(function(){
								mo.play();
							}, 20000);
						}
					} else {
						mo.off('files_search', filesSearch);
					}
				};
				mo.on('files_search', filesSearch);
			}
			
		}
	},
	isPlaying: function(playlist, force){
		if (this.c_song){
			var pl = this.c_song && this.c_song.plst_titl;
			if (pl){
				if (playlist === pl ){
					return pl;
				} else if (force || (pl.belongsToArtist())){
					if (pl.compare(playlist)){
						return pl;
					}
				}
			}
			
		}
	},
	changeNowPlaying: function(mo){
		var last_mo = this.c_song;
		if (last_mo != mo){
			this.removeCurrentWantedSong();

			if (last_mo && last_mo.state('active') && this.c_song != mo){
				mo.view()
			}
			if (last_mo){
				last_mo.stop();
			}
			if (this.nowPlaying){
				this.nowPlaying(mo);
			}
			
			mo.plst_titl.lev.freeze();
			this.c_song = mo;
		}
	}
});