define(['pv'], function(pv) {
"use strict";

var pvUpdate = pv.update;

var playRelative = function(mo, result) {
	if (result === true) {
		mo.map_parent.setWaitingNextSong(mo.map_parent, mo);
	} else if (result) {
		return result;
	}
};

var finup = function(callback) {
	callback.finup = true;
	return callback;
};

function PlayRequest() {}
pv.Model.extendTo(PlayRequest, {
	// init: function() {
	//		this._super.apply(this, arguments);
	// },
	//	'compx-'
	'compx-play_inited': [
		['play_inited', 'resolved'],
		function(play_inited, resolved) {
			return play_inited || resolved;
		}
	],
	'compx-possible_song': [
		['@wanted_song', 'wanted_file', 'next_song', 'active', 'play_inited'],
		function (wanted_song, wanted_file, next_song, active, play_inited) {
		  return active && (play_inited ? next_song : (!wanted_file && wanted_song));
		}
	],
	'stch-possible_song': finup(function(target, song, oldsong) {
		target.updateNesting('possible_song', song);

		if (oldsong) {
			pvUpdate(oldsong, 'want_to_play', false);
		}

		if (song) {
			pvUpdate(song, 'want_to_play', true);
			song.makeSongPlayalbe(true);
		}
	}),
	'compx-song_files_ready': [
		['@one:files_search:possible_song', '@one:player_song:possible_song'],
		function(files_search, is_player_song) {
			return !is_player_song && files_search;
		}
	],
	'compx-expected_song': [
		['wanted_file', 'possible_song'],
		function(wanted_file, possible_song) {
			return (wanted_file && wanted_file.mo) || possible_song;
		}
	],
	'compx-playable_mopla': [
		['song_files_ready', '@one:mf_cor_current_mopla:possible_song'],
		function (opts, mopla) {
			if (!opts) {return;}
			var mo = this.getNesting('possible_song');
			if (mo.canPlay()){
				if (!opts.exsrc_incomplete && (opts.search_complete || opts.have_best_tracks)){
					return mopla;
				}
			}
		}
	],
	'stch-playable_mopla': finup(function(target, mopla) {
		if (mopla) {
			var mo = target.getNesting('possible_song');
			mo.play();
			// mopla.play();
		}
	}),
	// 'stch-song_files_ready': function(target, opts) {
	// 	if (!opts) {return;}
	// 	var mo = this.getNesting('possible_song');
	// 	if (mo.canPlay()){
	// 		if (!opts.exsrc_incomplete && (opts.search_complete || opts.have_best_tracks)){
	// 			// mo.play();
	// 		}
	// 	}
	// },
	'compx-timer': [
		['need_timer_for'],
		function(song) {
			if (song) {
				return setTimeout(function() {
					song.play();
				}, 20000);
			}
		}
	],
	'stch-timer': function(target, state, oldstate) {
		if (oldstate) {
			clearTimeout(oldstate);
		}
	},
	'compx-need_timer_for': [
		['song_files_ready', 'current_song'],
		function(opts, current_song) {
			if (!opts) {return;}
			var mo = this.getNesting('possible_song');
			if (mo == current_song) {return;}
			if (!mo.canPlay()) {return;}

			if (!opts.exsrc_incomplete && (opts.search_complete || opts.have_best_tracks)){

			} else {
				return mo;
			}
		}
	],
	switchSong: function(song) {
		pv.update(this, 'next_song', song);
	},
	playNext: function() {
		var current_song = this.state('current_song');

		if (current_song.state('rept-song')){
			current_song.play();
			pv.update(this, 'next_song', current_song);
		} else {
			
			var next_song = playRelative(current_song, current_song.map_parent.switchTo(current_song, true, true));
			this.switchSong(next_song);
			
		}

		// mo.playNext(auto);
	}
	
});
return PlayRequest;
});