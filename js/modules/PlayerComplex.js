define(['./PlayerBase', 'pv', '../libs/BrowseMap'], function(PlayerBase, pv, BrowseMap) {
'use strict';


var removeCurrentWantedSong = function(obj){
	if (obj.wanted_song){
		pv.update(obj.wanted_song, 'want_to_play', false);
		obj.wanted_song = null;
	}
};

var PlayerComplex = function(){};
PlayerBase.extendTo(PlayerComplex, {
	constructor: PlayerComplex,
	playNext: function(mo, auto){
		mo.playNext(auto);
	},
	playPrev: function(mo){
		mo.playPrev();
	},
	onPlaybackFinish: function() {
		this.resolved.playNext();
	},
	onPlaybackError: function(song, can_play) {
		if (!can_play){
			if (song.isSearchAllowed() && song.state('search_complete')){
				this.playNext(this.c_song, true);
			} else {
				this.wantSong(song);
			}
			
		} else {
			song.play();
		}
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
	requestPlay: function(req) {
		if (this.req) {
			pv.update(this.req, 'active', false);
		}
		this.req = req;
		if (this.req) {
			pv.update(this.req, 'active', true);
		}
	},
	wantSong: function(mo){
		throw new Error('NOT USE THIS!, use requestPlay');

		var _this = this;
		if (this.wanted_song !== mo){
			removeCurrentWantedSong(this);
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


		var req = this.req;
		var resolved = this.resolved;

		var is_requsted = req && req.state('expected_song') == mo;
		var is_resolved = resolved && resolved.getNesting('possible_song') == mo;
		var current = resolved && resolved.state('current_song') == mo;

		if (is_requsted || is_resolved || current) {
			if (is_requsted) {

				if (this.resolved && this.resolved != this.req) {
					pv.update(this.resolved, 'active', false);
				}

				pv.update(this.req, 'resolved', true);
				this.resolved = this.req;
				this.req = null;
			}

			pv.update(this.resolved, 'current_song', mo);

			var last_mo = this.c_song;
			if (last_mo != mo){

				removeCurrentWantedSong(this);


				if (last_mo && resolved) {
					var bwlev = resolved.getNesting('bwlev');
					var pl_bwlev = BrowseMap.getConnectedBwlev(bwlev, last_mo.map_parent);
					var last_bwlev = pl_bwlev && BrowseMap.getBwlevFromParentBwlev(pl_bwlev, last_mo);
					if (last_bwlev && last_bwlev.state('mp_show')) {
					 	pl_bwlev.followTo(mo._provoda_id);
					}
				}

				if (last_mo && last_mo.state('mp_show') && this.c_song != mo){
					// mo.showOnMap();
				}

				if (last_mo){
					last_mo.stop();
					pv.update(last_mo, "player_song", false);
				}

				if (this.nowPlaying){
					this.nowPlaying(mo);
				}

				var bwlev = this.resolved.getNesting('bwlev');
				var pl_bwlev = BrowseMap.getConnectedBwlev(bwlev, mo.map_parent);
				
				if (pl_bwlev){
					BrowseMap.freeze(pl_bwlev);
					// pl_bwlev.freeze();
				}

				this.c_song = mo;
				pv.update(mo, 'player_song', true);
			}
			this.trigger('now_playing-signal', last_mo != mo, mo, last_mo);
		} else {
			throw new Error('do not expect this!');
		}

		
	}
});


return PlayerComplex;
});