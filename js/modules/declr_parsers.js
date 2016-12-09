define(['spv','js/models/Mp3Search/index', 'js/common-libs/htmlencoding'],function(spv, Mp3Search, htmlencoding) {
"use strict";

var toArrayByKeys = function(r) {
	var result_list = [];
	for (var num in r){
		if (num == parseInt(num, 10) && r[num]){
			result_list.push(r[num]);
		}
	}
	return result_list;
};
var start_end_spaces = /^\s+|\s+$/gi;

var hypem_tracks_morph = function(result_list) {
	var track_list = [];
	for (var i = 0; i < result_list.length; i++) {
		var cur = result_list[i];
		var song_omo = {
			artist: cur.artist,
			track: cur.title
		};
		if (!song_omo.artist){
			song_omo = Mp3Search.guessArtist(cur.title);
		}
		song_omo.image_url = cur.thumb_url;
		song_omo.artist = song_omo.artist && song_omo.artist.replace(start_end_spaces, '');

		track_list.push(song_omo);

		if (!song_omo.artist){
			console.log('there is no needed attributes');
			console.log(cur);
		}

	}
	return track_list;
};
var hypem_fixed_limit = 20;
return {
	hypem: {
		tracks: [
			function(r, spec, convs) {
				var array = toArrayByKeys(r);
				return hypem_tracks_morph(array, spec, convs);
			},
			true
		]
	},
	lfm: {
		getUsers: function(field, no_paging, pag_field) {
			return [
				{
					is_array: true,
					source: field + '.user',
					props_map: {
						userid: 'name',
						realname: null,
						country: null,
						age: ['num', 'age'],
						gender: null,
						playcount: ['num', 'playcount'],
						playlists: ['num', 'playlists'],
						lfm_img: ['lfm_image', 'image'],
						registered: ['timestamp', 'registered'],
						scrobblesource: null,
						recenttrack: null,
					}
				},
				!no_paging && this.getPaging(pag_field || field)
			];
		},
		getPaging: function(field) {
			return {
				source: field + '.@attr',
				props_map: {
					page_num: ['num', 'page'],
					items_per_page: ['num', 'perPage'],
					total_pages_num: ['num', 'totalPages'],
					total: ['num', 'total']
				}
			};
		},
		getTracks: function(field, no_paging, pag_field) {
			return [{
				is_array: true,
				source: field + '.track',
				props_map: {
					artist: 'artist.name',
					track: 'name',
					lfm_img: ['lfm_image', 'image']
				}
			},
			!no_paging && this.getPaging(pag_field || field)];
		},
		getArtists: function(field, no_paging, pag_field) {
			return [{
				is_array: true,
				source: field + '.artist',
				props_map: {
					artist_name: 'name',
					artist: 'name',
					lfm_img: ['lfm_image', 'image']
				}
			},
			!no_paging && this.getPaging(pag_field || field)];
		},
		getAlbums: function(field, no_paging, pag_field) {
			return [{
				is_array: true,
				source: field + '.album',
				props_map: {
					album_artist: 'artist.name',
					album_name: 'name',
					playcount: ['num', 'playcount'],
					lfm_img: ['lfm_image', 'image'],
					original_artist: '#artist'
				}
			},
			!no_paging && this.getPaging(pag_field || field)];
		}
	},
	exfm: {
		tracks_no_paging: [
			{
				is_array: true,
				source: 'songs',
				props_map: {
					artist: 'artist',
					track: 'title'
				}
			},
			false,
			[['files', {
				is_array: true,
				source: 'songs',
				props_map: {
					artist: 'artist',
					track: 'title',
					link: 'url'
				}
			}]]
		]
	},
	soundcloud: {
		tracksFn: function(tracks) {
			var track_list = [];
			var artcard_artist = this.head.artist_name;
			for (var i = 0; i < tracks.length; i++) {
				var cur = tracks[i];
				var song_data = Mp3Search.guessArtist(cur.title, artcard_artist);
				if (!song_data || !song_data.artist){
					if (this.allow_artist_guessing){
						song_data = {
							artist: artcard_artist,
							track: cur.title
						};
					} else {
						song_data = {
							artist: cur.user.username,
							track: cur.title
						};
					}


				}
				song_data.track = htmlencoding.decode(song_data.track);
				song_data.image_url = cur.artwork_url;
				song_data.file = this.app.start_page.mp3_search.getSearchByName('soundcloud').makeSongFile(cur);
				track_list.push(song_data);
			}
			return track_list;
		}
	},
	vk: {
		parseTrack: parseVkTrack,
		getTracksFn: function(field) {
			return function(r) {
				var track_list = [];

				var items = spv.getTargetField(r, field);

				for (var i = 0; i < items.length; i++) {
					var cur = items[i];
					track_list.push({
						artist: htmlencoding.decode(cur.artist),
						track: htmlencoding.decode(cur.title),
						file: parseVkTrack(cur)
					});
				}
				return track_list;
			};
		}
	}
};


function parseVkTrack(cursor) {
  if (!cursor || !cursor.url) {
    return;
  }
  return {
    artist	: htmlencoding.decode(cursor.artist ? cursor.artist : cursor.audio.artist),
    duration	: parseFloat(typeof cursor.duration == 'number' ? cursor.duration : cursor.audio.duration) * 1000,
    link		: cursor.url ? cursor.url : cursor.audio.url,
    track		: htmlencoding.decode(cursor.title ? cursor.title : cursor.audio.title),
    from		: 'vk',
    downloadable: false,
    _id			: cursor.owner_id + '_' + cursor.id,
    type: 'mp3',
    media_type: 'mp3'
  };
}
});
