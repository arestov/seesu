define(function () {
'use strict';
var artist_name_regexp = /([\s\S]*?)\s?[\—\-\—\–]\s/;
var track_title_clearing_regexp = /^\d+[\s\.\—\-\—\–\_\|\+\(\)\*\&\!\?\@\,\\\/\❤\♡\'\"\[\]]*\s?/;
var has_prefix_digits_regexp = /^\d+?\s?\S*?\s/;
return function guessArtist(track_title_raw, query_artist){
	var track_title = track_title_raw.slice(0, 80);

	var r = {};
	if (!track_title){
		return r;
	}
	var remove_digits = !query_artist || query_artist.search(has_prefix_digits_regexp) === 0;

	if (remove_digits){
		var matched_spaces = track_title.match(/\s?[\—\-\—\–]\s/gi);
		if (matched_spaces && matched_spaces.length > 1){
			track_title = track_title.replace(track_title_clearing_regexp,"");
		}
		///^\d+[\s\.\—\-\—\–\_\|\+\(\)\*\&\!\?\@\,\\\/\❤\♡\'\"\[\]]*\s?/  for "813 - Elastique ( Rinse FM Rip )"

		//01 The Killers - Song - ::remove number
	}

	var title_parts = track_title.split(/\s?[\—\-\—\–]\s/);
	var artist_name_match = track_title.match(artist_name_regexp);
	if (title_parts && title_parts.length > 1){
		if (title_parts[0] == query_artist){
			r.artist = artist_name_match[1];
			r.track = track_title.replace(artist_name_match[0], '');
		} else if (title_parts[title_parts.length-1] == query_artist){
			var end_artist_name_match = track_title.match(/\s?[\—\-\—\–]\s([\s\S]*?)$/);
			if (end_artist_name_match && end_artist_name_match[1]){
				r.artist = end_artist_name_match[1];
				r.track = track_title.replace(end_artist_name_match[0], '');
			}
		}
	}
	if (!r.artist){
		var wordby_match = track_title.match(/by[\s]+?(.+)/);
		if (query_artist && wordby_match && wordby_match[1] && wordby_match[1] == query_artist){
			r.artist = query_artist;
			r.track = track_title.replace(wordby_match[0], '');
		} else if (title_parts && title_parts.length > 1){
			r.artist = artist_name_match[1];
			r.track = track_title.replace(artist_name_match[0], '');
		} else if (query_artist && wordby_match){
			r.artist = query_artist;
			r.track = track_title.replace(wordby_match[0], '');
		}
	}
	return r;
};
});
