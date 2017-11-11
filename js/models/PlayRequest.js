define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');

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

var PlayRequest = spv.inh(pv.Model, {}, {
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
		['active', 'play_inited', 'next_song', '@wanted_song', 'wanted_file', 'song_of_wanted_file'],
		function (active, play_inited, next_song, wanted_song, wanted_file, song_of_wanted_file) {
		  return active && (
		  	(play_inited && next_song) ?
		  		next_song :
		  		(wanted_file ? song_of_wanted_file : wanted_song));
		}
	],
	'stch-possible_song': finup(function(target, song, oldsong) {
		target.updateNesting('possible_song', song);

		if (oldsong) {
			pvUpdate(oldsong, 'want_to_play', false);
		}
		if (song) {
			pvUpdate(song, 'want_to_play', true);
		}

		if (song) {
			song.makeSongPlayalbe(true);
		}
	}),
	'compx-song_files_ready': [
		// ['@one:files_search:possible_song', '@one:player_song:possible_song'],
		['@one:files_search:possible_song'],
		function(files_search) {
			return files_search;
		}
	],
	'compx-expected_song': [
		['wanted_file', 'possible_song'],
		function(wanted_file, possible_song) {
			return (wanted_file && wanted_file.mo) || possible_song;
		}
	],

	'compx-playable_mopla': [
		['no_wait', 'song_files_ready', '@one:mf_cor_current_mopla:possible_song', '@one:can_play:possible_song.mf_cor'],
		function (no_wait, opts, mopla, can_play) {
			if (no_wait) {
				return mopla;
			}

			if (!opts || !can_play) {return;}

			if (!opts.exsrc_incomplete && (opts.search_complete || opts.have_best_tracks)){
				return mopla;
			}
		}
	],
	'stch-playable_mopla': finup(function(target, mopla) {
		if (mopla) {
			var mo = target.getNesting('possible_song');
			mo.play();
		}
	}),
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

	},
	'compx-no_wait': [
		['possible_song', 'song_of_wanted_file'],
		function(possible_song, song_of_wanted_file) {
			return possible_song === song_of_wanted_file;
		}
	],
	'compx-song_of_wanted_file': [
		['wanted_file'],
		function(wf) {
			return wf && wf.mo;
		}
	],
	'stch-song_of_wanted_file': function(target, value) {
		target.updateNesting('song_of_wanted_file', value);
	}
});
return PlayRequest;
});
