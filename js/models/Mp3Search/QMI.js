define(function (require) {
'use strict';
var spv = require('spv');
var guessArtist= require('./guessArtist');
var hex_md5 = require('hex_md5');
var hardTrim = spv.hardTrim;

var getQueryString = function(msq) {
	return (msq.artist || '') + (msq.track ?  (' - ' + msq.track) : '');
};

var QueryMatchIndex = function() {};

spv.Class.extendTo(QueryMatchIndex, {
	init: function() {

	},
	match: function(){
		if (!this.trim_index) {
			this.trim_index = {};
		}
		for (var i = 0; i < this.match_order.length; i++) {
			var match_index = this.match_order[i].call(this, this.under_consideration, this.query);
			if (typeof match_index == 'number'){
				if (match_index !== 0){
					while (match_index >= 10){
						match_index = match_index/10;
					}
				}
				this.match_index = i * 10 + match_index * 1;
				break;
			}

		}
		if (typeof this.match_index != 'number'){
			this.match_index = -1;
		}
		this.trim_index = null;
	},
	toQueryString: function(msq) {
		return (msq.artist || '') + (msq.track ?  (' - ' + msq.track) : '');
	},
	valueOf: function(){
		return this.match_index;
	},
});

function hardTrimLimited(string, min_length){
  if (!string) {return '';}
  var trimmed = hardTrim(string);

  if (!min_length){
    return trimmed;
  } else {
    if (trimmed.length >= min_length){
      return trimmed;
    } else {
      return string;
    }
  }
}

var SongQueryMatchIndex = function(song_item, query){
	this.trim_index = null;
	this.under_consideration = song_item;
	this.query = query;
	this.query_string = this.toQueryString(this.query);
	this.match_order = [this.matchers.full, this.matchers.almost, this.matchers.anyGood, this.matchers.byWordsInTrackField, this.matchers.byWordsInFullTitle, this.matchers.inDescription];
	this.match();
};

QueryMatchIndex.extendTo(SongQueryMatchIndex, {

	matchers: {
		full: function(file_song, query){
			return (file_song.artist == query.artist && (!query.track || file_song.track == query.track)) && 0;
		},
		almost: function(file_song, query){
      if (!query.artist || !file_song.artist) {
        return;
      }
      var trimmed_query_artist = hardTrimLimited(query.artist);
      var trimmed_query_track = hardTrimLimited(query.track);
      if (trimmed_query_artist.length >= 3 && (!query.track || trimmed_query_track.length >= 3)){
        return (trimmed_query_artist == hardTrimLimited(file_song.artist) && (!query.track || trimmed_query_track == hardTrimLimited(file_song.track))) && 0;
      }

		},
		anyGood: function(file_song, query){
			var full_title = hardTrimLimited(((file_song.artist || "" ) + ' ' + (file_song.track || "" )), 3);

			if (query.q){

				if (full_title.indexOf(hardTrimLimited(query.q, 3)) != -1){
					return 0;
				}
			} else {
				var query_artist = hardTrimLimited(query.artist, 3);
				var artist_match = file_song.artist && query_artist && hardTrimLimited(file_song.artist, 3).indexOf(query_artist) != -1;

				if (!query.track){
					if (artist_match){
						return 0;
					}
				} else {
					var query_track = hardTrimLimited(query.track, 3);
					var track_match  = file_song.track && query_track && hardTrimLimited(file_song.track, 3).indexOf(query_track) != -1;
					if (artist_match && track_match){
						return 0;
					} else {
						this.artist_in_full_title = query_artist && full_title.indexOf(query_artist) != -1;
						var hard_track_match = file_song.track && query_track && full_title.indexOf(query_track) != -1;
						if (this.artist_in_full_title && hard_track_match){
							return 5;
						}
					}
				}


			}
		},
		byWordsInTrackField: function(file_song, query){
			if (this.artist_in_full_title && query.track){
				var match = spv.matchWords(hardTrimLimited(file_song.track, 3), hardTrimLimited(query.track, 3));
				if (match.forward){
					return 0;
				} else if (match.any){
					return 5;
				}
			}
		},
		byWordsInFullTitle: function(file_song, query){
			if (this.artist_in_full_title && query.q || query.track){
				var full_title = hardTrimLimited(((file_song.artist || "" ) + ' ' + (file_song.track || "" )), 3);
				var full_query =  query.q || ((query.artist || '') + ' - ' + (query.track || ''));
				var match = spv.matchWords(full_title, hardTrimLimited(full_query, 3));
				if (match.forward){
					return 0;
				} else if (match.any){
					return 5;
				}
			}
		},
		inDescription: function(file_song, query){
      if (!file_song.description || !query.track) {return;}

      var rows = getUsefulDescParts(file_song.description);

      if (rows.length > 1){
        return someUsefulDescriptionRow(query, rows);
      } else {
        return firstDescriptionRow(query, file_song);
      }
		}
	}
});

function someUsefulDescriptionRow(query, rows) {
  for (var i = 0; i < rows.length; i++) {
    var guess_info  = guessArtist(rows[i], query.artist);
    if (!guess_info.artist){
      continue;
      //guess_info.track = full_title; - why!?!?
    }
    var maindex = new SongQueryMatchIndex(guess_info, query);
    if (maindex != -1){
      return maindex * 1;
    }
  }
}

function firstDescriptionRow(query, file_song) {
  var full_title = hardTrimLimited(file_song.description, 3);
  if (!full_title){
    return false;
  }
  var query_artist = hardTrimLimited(query.artist, 3);
  var query_track = hardTrimLimited(query.track, 3);
  var artist_match = file_song.artist && query_artist && full_title.indexOf(query_artist) != -1;
  var track_match = file_song.track && query_track && full_title.indexOf(query_track) != -1;
  if (artist_match && track_match){
    return 9;
  }
}

var spaces = /\s/gi;
var filterParts = function (item) {
  return item && item.replace(spaces, '') && item.length <= 100;
};

function getUsefulDescParts(description) {
  return description.split(/\n/).filter(filterParts);
}

var getQMSongIndex= spv.memorize(function (msq, song) {
  return ( new SongQueryMatchIndex(song, msq) * 1 );
}, function (msq, song) {
  var first_part = msq.artist + '-' + msq.track + ' : ';
  if (song.description) {
    return first_part + hex_md5(song.artist + song.track + song.description);
  }
  return first_part + song.artist + song.track;
});

return {
  QueryMatchIndex: QueryMatchIndex,
  getQueryString: getQueryString,
  SongQueryMatchIndex: SongQueryMatchIndex,
  getQMSongIndex: getQMSongIndex,
};

});
