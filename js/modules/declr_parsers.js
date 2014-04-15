define(['spv','js/libs/Mp3Search'],function(spv, Mp3Search) {
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
		tracks: function(tracks) {
			
		}
	}
};
});