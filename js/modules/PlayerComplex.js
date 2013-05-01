define(['./PlayerBase'], function(PlayerBase) {
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
	removeCurrentWantedSong: function(){
		if (this.wanted_song){
			this.wanted_song.updateState('want_to_play', false);
			delete this.wanted_song;
		}
	},
	wantSong: function(mo){
		var _this = this;
		if (this.wanted_song !== mo){
			this.removeCurrentWantedSong();
			if (!this.c_song){
				if (mo.plst_titl.lev){
					mo.plst_titl.lev.freeze();
				}
			}
			(this.wanted_song = mo).updateState('want_to_play', true);
			
			var opts = mo.state('files_search');
			if (opts && ((opts.search_complete && opts.have_mp3_tracks) || opts.have_best_tracks)){
				mo.play();
				clearTimeout(_this.cantwait_toplay);
			} else {
				var filesSearch = function(e){
					var opts = e.value;
					if (_this.wanted_song == mo){
						if (mo.canPlay()){
							if (opts.search_complete || opts.have_best_tracks){
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
						mo.off('state-change.files_search', filesSearch);
					}
				};
				mo.on('state-change.files_search', filesSearch, {skip_reg: true});
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
				last_mo.updateState("player_song", false);
			}
			if (this.nowPlaying){
				this.nowPlaying(mo);
			}
			
			if (mo.plst_titl.lev){
				mo.plst_titl.lev.freeze();
			}
			this.c_song = mo;
			mo.updateState("player_song", true);
		}
		this.trigger('now_playing-signal', last_mo != mo, mo, last_mo);
	}
});


return PlayerComplex;
});