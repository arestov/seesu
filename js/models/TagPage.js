define(['spv', 'app_serv','js/libs/BrowseMap', './ArtCard', './LoadableList', './SongsList', 'js/modules/declr_parsers', 'js/lastfm_data'],
function(spv, app_serv, BrowseMap, ArtCard, LoadableList, SongsList, declr_parsers, lastfm_data){
"use strict";
var localize = app_serv.localize;



var SimilarTags = function() {};

LoadableList.TagsList.extendTo(SimilarTags, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		this.initStates();
	},
	'nest_req-tags_list': [
		[{
			is_array: true,
			source: 'similartags.tag',
			props_map: {
				count: null,
				name: null
			}
		}],
		['lfm', 'get', function() {
			return ['tag.getSimilar', {
				tag: this.tag_name
			}];
		}]
	]
});

var TagAlbums = function() {};

ArtCard.AlbumsList.extendTo(TagAlbums, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		this.initStates();
	},
	page_limit: 50,
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('topalbums'),
		['lfm', 'get', function() {
			return ['tag.getTopAlbums', {
				tag: this.tag_name
			}];
		}]
	]
});


var HypemTagPlaylist = function() {};
SongsList.HypemPlaylist.extendTo(HypemTagPlaylist, {
	getHypeTagName: function() {
		// instrumental hip-hop >> instrumental hip hop,
		//but trip-hip >> trip-hip (not change)
		var test_regexp = /\s|-/gi;
		var result = this.tag_name.match(test_regexp);
		if (result && result.length >= 2){
			return this.tag_name.replace(test_regexp, ' ');
		} else {
			return this.tag_name;
		}
	},
	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['hypem', 'get', function(opts) {
			var path = '/playlist/tags/' + this.getHypeTagName() + '/json/' + opts.paging.next_page +'/data.js';
			return [path, this.send_params];
		}]
	]
});
var Fav25HypemTagSongs = function() {};
HypemTagPlaylist.extendTo(Fav25HypemTagSongs, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		this.initStates();
	},
	send_params: {
		fav_from: 25,
		fav_to: 250
	}
});
var Fav250HypemTagSongs = function() {};
HypemTagPlaylist.extendTo(Fav250HypemTagSongs, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		this.initStates();
	},
	send_params: {
		fav_from: 250,
		fav_to: 100000
	}
});

var AllHypemTagSongs = function() {};
HypemTagPlaylist.extendTo(AllHypemTagSongs, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		this.initStates();
	}
});

/*var ExplorableTagSongs = function() {};
SongsList.extendTo(ExplorableTagSongs, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		this.initStates();
	},
	page_limit: 100,
	'nest_req-songs-list': [
		declr_parsers.exfm.tracks_no_paging,
		['exfm', 'get', function(opts) {
			return ['explore/' + this.tag_name, {
				results: opts.paging.page_limit,
				start: opts.paging.next_page
			}];
		}]
	]
});

var TrendingTagSongs = function() {};
SongsList.extendTo(TrendingTagSongs, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;

		this.initStates();
	},
	page_limit: 100,
	'nest_req-songs-list': [
		declr_parsers.exfm.tracks_no_paging,
		['exfm', 'get', function(opts) {
			return ['trending/tag/' + this.tag_name, {
				results: opts.paging.page_limit,
				start: opts.paging.next_page
			}];
		}]
	]
});*/

var FreeTagSongs = function() {};
SongsList.extendTo(FreeTagSongs, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;

		this.initStates();
	},
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
		['lfm', 'get', function() {
			return ['playlist.fetch', {
				playlistURL: 'lastfm://playlist/tag/' + this.tag_name + '/freetracks'
			}];
		}]
	]
});




var TopTagSongs = function() {};
SongsList.extendTo(TopTagSongs, {
	init: function(opts, params) {

		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;

		this.initStates();
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['tag.getTopTracks', {
				tag: this.tag_name
			}];
		}]
	]

});


var SongsLists = function() {};
BrowseMap.Model.extendTo(SongsLists, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		this.initStates();

		this.sub_pa_params = {tag_name:this.tag_name};
	},
	'nest-lists_list': [['_', 'free', /*'trending_exfm', 'explore_exfm',*/
			'blogged', 'blogged?fav_from=25&fav_to=250', 'blogged?fav_from=250&fav_to=100000'], true],
	model_name: 'tag_songs',
	sub_pa: {
		'_': {
			constr: TopTagSongs,
			title: localize('Top')
		},
		'free': {
			constr: FreeTagSongs,
			title: localize('Free-songs')
		},
	/*	'trending_exfm': {
			constr: TrendingTagSongs,
			title: localize('Trending-songs-exfm')
		},
		'explore_exfm': {
			constr: ExplorableTagSongs,
			title: localize('Explore-songs-exfm')
		},*/
		'blogged': {
			constr: AllHypemTagSongs,
			title: localize('Blogged-all-hypem')
		},
		'blogged?fav_from=25&fav_to=250': {
			constr: Fav25HypemTagSongs,
			title: localize('Blogged-25-hypem')
		},
		'blogged?fav_from=250&fav_to=100000': {
			constr: Fav250HypemTagSongs,
			title: localize('Blogged-250-hypem')
		}
	}
});


var WeekTagArtists = function() {};
ArtCard.ArtistsList.extendTo(WeekTagArtists, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;

		this.initStates();
	},
	page_limit: 130,
	getRqData: function(paging_opts) {
		return {
			tag: this.tag_name,
			limit: paging_opts.page_limit,
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('weeklyartistchart', true),
		['lfm', 'get', function(opts) {
			return ['tag.getWeeklyArtistChart', this.getRqData(opts.paging)];
		}]
	]
});

var TagTopArtists = function() {};
ArtCard.ArtistsList.extendTo(TagTopArtists, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;

		this.initStates();
	},
	page_limit: 130,
	getRqData: function(paging_opts) {
		return {
			tag: this.tag_name,
			limit: paging_opts.page_limit
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists', true),
		['lfm', 'get', function(opts) {
			return ['tag.getTopArtists', this.getRqData(opts.paging)];
		}]
	]
});

var ArtistsLists = function() {};
BrowseMap.Model.extendTo(ArtistsLists, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		this.initStates();

		this.sub_pa_params = {tag_name:this.tag_name};
	},
	'nest-lists_list': [['_', 'week'], true],
	model_name: 'tag_artists',
	sub_pa: {
		'_': {
			constr: TagTopArtists,
			title: localize('Top')
		},
		'week': {
			constr: WeekTagArtists,
			title: localize('Week-chart')
		}
	}
});


var TagPage = function() {};
BrowseMap.Model.extendTo(TagPage, {
	init: function(opts, data) {
		this._super.apply(this, arguments);

		this.tag_name = data.tag_name;
		//this.updateManyStates(data);
		this.initStates();
		//this.updateState('tag_name', this.head_props.tag_name);
		//this.sub_pa_params = {tag_name:this.tag_name};

	},
	allow_data_init: true,
	data_by_hp: true,
	hp_bound: {
		tag_name: null
	},
	'nest-artists_lists': ['artists'],
	'nest-songs_list': ['songs'],
	'nest-albums_list': ['albums'],
	'nest-similar_tags': ['similar'],

	'nest-pwis': [['albums','similar'], true],
	model_name: 'tag_page',
	sub_pa: {
		'similar': {
			constr: SimilarTags,
			getTitle: function() {
				return localize('Similar-to') + ' ' + this.head_props.tag_name + ' ' + localize('Tags').toLowerCase();
			}
		},
		'artists': {
			constr: ArtistsLists,
			title: localize('Artists')
		},
		'songs': {
			constr: SongsLists,
			title: localize('Songs')
		},
		'albums': {
			constr: TagAlbums,
			getTitle: function() {
				return localize('Top') + ' ' + this.head_props.tag_name + ' ' + localize('Albums');
			}
		}
	}

});


var TagsList = function() {};
LoadableList.TagsList.extendTo(TagsList, {
	init: function() {
		this._super.apply(this, arguments);
		this.initStates();

		if (lastfm_data.toptags) {
			this.setPreview(lastfm_data.toptags.map(function(el) {
				return {
					name: el
				};
			}));
			
		}

	},
	'nest_req-tags_list': [
		[{
			is_array: true,
			source: 'toptags.tag',
			props_map: {
				count: null,
				name: null
			}
		}],
		['lfm', 'get', function(opts) {
			return ['tag.getTopTags', {limit: opts.paging.page_limit}];
		}]
	],
	getSPC: function() {
		return TagPage;
	},
	subPager: function(sub_path_string){
		var page_name = sub_path_string;//spv.capitalize(sub_path_string);
		if (!this.sub_pages[page_name]){
			var Constr = this.getSPC();
			var instance = new Constr();
			this.sub_pages[page_name] = instance;
			return [instance, {
				nav_title: localize('Tag') + ' ' + page_name,
				url_part: '/' + page_name,
				tag_name: page_name
			}];
		}
		return this.sub_pages[page_name];

	},
	page_limit: 150
});

//TagsList
return TagsList;
});