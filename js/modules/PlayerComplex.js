define(['./PlayerBase', 'pv'], function(PlayerBase, pv) {
'use strict';
var PlayerComplex = function(){};
PlayerBase.extendTo(PlayerComplex, {
	constructor: PlayerComplex,
	playNext: function(mo, auto){
		mo.playNext(auto);
	},
	playPrev: function(mo){
		mo.playPrev();
	},
	
	setWaitingPlaylist: function(playlist) {
		this.waiting_playlist = playlist;
		var _this = this;
		this.once('now_playing-signal', function() {
			if (_this.waiting_playlist == playlist){
				_this.waiting_playlist = null;
			}
		});
	},
	removeCurrentWantedSong: function(){
		if (this.wanted_song){
			pv.update(this.wanted_song, 'want_to_play', false);
			delete this.wanted_song;
		}
	},
	wantSong: function(mo){
		var _this = this;
		if (this.wanted_song !== mo){
			this.removeCurrentWantedSong();
			if (!this.c_song){
				if (mo.map_parent.lev){
					mo.map_parent.lev.freeze();
				}
			}
			pv.update((this.wanted_song = mo), 'want_to_play', true);
			
			var opts = mo.state('files_search');
			if (opts && !opts.exsrc_incomplete && ((opts.search_complete && opts.have_mp3_tracks) || opts.have_best_tracks)){
				mo.play();
				clearTimeout(_this.cantwait_toplay);
			} else {
				var filesSearch = function(e){
					var opts = e.value;
					if (_this.wanted_song == mo){
						if (mo.canPlay()){
							if (!opts.exsrc_incomplete && (opts.search_complete || opts.have_best_tracks)){
								clearTimeout(_this.cantwait_toplay);
								mo.play();
							} else if (!_this.cantwait_toplay){
								_this.cantwait_toplay = setTimeout(function(){
									if (_this.wanted_song == mo){
										mo.play();
									}
									
								}, 20000);
							}
						}
						
					} else {
						mo.off('state_change-files_search', filesSearch);
					}
				};
				mo.on('state_change-files_search', filesSearch, {skip_reg: true});
			}
			
		}
	},

	changeNowPlaying: function(mo, playing){
		if (this.setPlayMark){
			this.setPlayMark(playing);
		}
		var last_mo = this.c_song;
		if (last_mo != mo){
			this.removeCurrentWantedSong();

			if (last_mo && last_mo.state('mp_show') && this.c_song != mo){
				mo.showOnMap();
			}
			if (last_mo){
				last_mo.stop();
				pv.update(last_mo, "player_song", false);
			}
			if (this.nowPlaying){
				this.nowPlaying(mo);
			}
			
			if (mo.map_parent.lev){
				mo.map_parent.lev.freeze();
			}
			this.c_song = mo;
			pv.update(mo, "player_song", true);
		}
		this.trigger('now_playing-signal', last_mo != mo, mo, last_mo);
	}
});


return PlayerComplex;
});