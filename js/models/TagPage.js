define(function(require) {
'use strict';
var spv = require('spv');
var BrowseMap = require('js/libs/BrowseMap');
var ArtCard = require('./ArtCard');
var LoadableList = require('./LoadableList');
var SongsList = require('./SongsList');
var declr_parsers = require('js/modules/declr_parsers');
var lastfm_data = require('js/lastfm_data');

var AlbumsList = ArtCard.AlbumsList;
var ArtistsList = ArtCard.ArtistsList;

var SimilarTags = spv.inh(LoadableList.TagsList, {}, {
	'nest_req-tags_list': [
		[{
			is_array: true,
			source: 'similartags.tag',
			props_map: {
				count: null,
				name: null
			}
		}],
		['#lfm', 'get', function() {
			return ['tag.getSimilar', {
				tag: this.head.tag_name
			}];
		}]
	]
});

var TagAlbums = spv.inh(AlbumsList, {}, {

	page_limit: 50,
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('albums'),
		['#lfm', 'get', function() {
			return ['tag.getTopAlbums', {
				tag: this.head.tag_name
			}];
		}]
	]
});


function getHypeTagName(tag_name) {
	// instrumental hip-hop >> instrumental hip hop,
	//but trip-hip >> trip-hip (not change)
	var test_regexp = /\s|-/gi;
	var result = tag_name.match(test_regexp);
	if (result && result.length >= 2){
		return tag_name.replace(test_regexp, ' ');
	} else {
		return tag_name;
	}
}


var HypemTagPlaylist = spv.inh(SongsList.HypemPlaylist, {}, {
	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['#hypem', 'get', function(opts) {
			var path = '/playlist/tags/' + getHypeTagName(this.head.tag_name) + '/json/' + opts.paging.next_page +'/data.js';
			return [path, this.send_params];
		}]
	]
});
var Fav25HypemTagSongs = spv.inh(HypemTagPlaylist, {}, {
	send_params: {
		fav_from: 25,
		fav_to: 250
	}
});
var Fav250HypemTagSongs = spv.inh(HypemTagPlaylist, {}, {
	send_params: {
		fav_from: 250,
		fav_to: 100000
	}
});

var AllHypemTagSongs = spv.inh(HypemTagPlaylist, {}, {
});

var FreeTagSongs = spv.inh(SongsList, {}, {
	'nest_req-songs-list': [
		[
			{
				is_array: true,
				source: 'playlist.trackList.track',
				props_map: {
					artist: 'creator',
					track: 'title',
					lfm_img: ['lfm_image', 'image']
				}
			},
			false,
			[['files', {
				is_array: true,
				source: 'playlist.trackList.track',
				props_map: {
					artist: 'creator',
					track: 'title',
					link: 'location'
				}
			}]]
		],
		['#lfm', 'get', function() {
			return ['playlist.fetch', {
				playlistURL: 'lastfm://playlist/tag/' + this.head.tag_name + '/freetracks'
			}];
		}]
	]
});




var TopTagSongs = spv.inh(SongsList, {}, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['#lfm', 'get', function() {
			return ['tag.getTopTracks', {
				tag: this.head.tag_name
			}];
		}]
	]

});


var SongsLists = spv.inh(BrowseMap.Model, {}, {
	'nest-lists_list': [['_', 'free', /*'trending_exfm', 'explore_exfm',*/
			'blogged', 'blogged?fav_from=25&fav_to=250', 'blogged?fav_from=250&fav_to=100000'], {
				preload_on: 'mp_has_focus',
			}],
	model_name: 'tag_songs',
	sub_page: {
		'_': {
			constr: TopTagSongs,
			title: [['#locales.Top']]
		},
		'free': {
			constr: FreeTagSongs,
			title: [['#locales.Free-songs']]
		},
	/*	'trending_exfm': {
			constr: TrendingTagSongs,
			title: [['#locales.Trending-songs-exfm']]
		},
		'explore_exfm': {
			constr: ExplorableTagSongs,
			title: [['#locales.Explore-songs-exfm']]
		},*/
		'blogged': {
			constr: AllHypemTagSongs,
			title: [['#locales.Blogged-all-hypem']]
		},
		'blogged?fav_from=25&fav_to=250': {
			constr: Fav25HypemTagSongs,
			title: [['#locales.Blogged-25-hypem']]
		},
		'blogged?fav_from=250&fav_to=100000': {
			constr: Fav250HypemTagSongs,
			title: [['#locales.Blogged-250-hypem']]
		}
	}
});


var WeekTagArtists = spv.inh(ArtistsList, {}, {

	page_limit: 130,
	getRqData: function(paging_opts) {
		return {
			tag: this.head.tag_name,
			limit: paging_opts.page_limit,
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('weeklyartistchart', true),
		['#lfm', 'get', function(opts) {
			return ['tag.getWeeklyArtistChart', this.getRqData(opts.paging)];
		}]
	]
});

var TagTopArtists = spv.inh(ArtistsList, {}, {
	page_limit: 130,
	getRqData: function(paging_opts) {
		return {
			tag: this.head.tag_name,
			limit: paging_opts.page_limit
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists', true),
		['#lfm', 'get', function(opts) {
			return ['tag.getTopArtists', this.getRqData(opts.paging)];
		}]
	]
});

var ArtistsLists = spv.inh(BrowseMap.Model, {}, {
	'nest-lists_list': [['_', 'week'], {
		preload_on: 'mp_has_focus',
	}],
	model_name: 'tag_artists',
	sub_page: {
		'_': {
			constr: TagTopArtists,
			title: [['#locales.Top']]
		},
		'week': {
			constr: WeekTagArtists,
			title: [['#locales.Week-chart']]
		}
	}
});


var TagPage = spv.inh(BrowseMap.Model, {}, {
	'nest-artists_lists': ['artists'],
	'nest-songs_list': ['songs'],
	'nest-albums_list': ['albums'],
	'nest-similar_tags': ['similar'],

	'nest-pwis': [['albums','similar'], {
		preload_on: 'mp_has_focus',
	}],
	model_name: 'tag_page',
	sub_page: {
		similar: [
			SimilarTags,
			[
				['#locales.Tags', '#locales.Similar-to', 'tag_name'],
				function (tags, similar, name) {
					if (!tags || !similar) {
						return name;
					}
					return similar + ' ' + name + ' ' + tags.toLowerCase();
				}
			]
		],
		'artists': {
			constr: ArtistsLists,
			title: [['#locales.Artists']]
		},
		'songs': {
			constr: SongsLists,
			title: [['#locales.Songs']]
		},
		'albums': [
			TagAlbums,
			[
				['#locales.Top', '#locales.Albums', 'tag_name'],
				function(top, albums, tag_name) {
					if (!top || !albums) {return tag_name;}
					return top + ' ' + tag_name + ' ' + albums;
				}
			]
		]
	}

});


var TagsList = spv.inh(LoadableList.TagsList, {
	init: function(target) {
		if (lastfm_data.toptags) {
			target.setPreview(lastfm_data.toptags.map(function(el) {
				return {
					name: el
				};
			}));
		}
	}
}, {
	'nest_req-tags_list': [
		[{
			is_array: true,
			source: 'toptags.tag',
			props_map: {
				count: null,
				name: null
			}
		}],
		['#lfm', 'get', function(opts) {
			return ['tag.getTopTags', {limit: opts.paging.page_limit}];
		}]
	],
	sub_pager: {
		item: [
			TagPage,
			[['#locales.Tag', 'tag_name'], function(desc, tag) {
				return desc && desc + ' ' + tag;
			}],
			{
				tag_name: 'decoded_name'
			}
		]
	},
	page_limit: 150
});

//TagsList
return TagsList;
});
