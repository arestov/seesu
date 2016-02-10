define(['spv', 'app_serv','./SongsList', './ArtCard', 'js/libs/BrowseMap', 'js/lastfm_data', 'js/modules/declr_parsers', 'pv'],
function (spv, app_serv, SongsList, ArtCard, BrowseMap, lastfm_data, declr_parsers, pv){
"use strict";
var parent_focus = [['^mp_has_focus']];
var heavyInitReactn = function(target, state) {
	if (state) {
		target.heavyInit();
	}
};

var MusicConductor;
//http://hypem.com/latest
var HypemPlaylist = SongsList.HypemPlaylist;
var ArtistsList = ArtCard.ArtistsList;
var localize = app_serv.localize;
var AllPHypemLatestSongs = spv.inh(HypemPlaylist, {}, {

	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['hypem', 'get', function(opts) {
			var path = '/playlist/latest/all/json/' + opts.paging.next_page +'/data.js';
			return [path, null];
		}]
	],
	page_limit: 30
});
var AllPHypemLatestRemixesSongs = spv.inh(HypemPlaylist, {}, {

	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['hypem', 'get', function(opts) {
			var path = '/playlist/latest/remix/json/' + opts.paging.next_page +'/data.js';
			return [path, null];
		}]
	]
});

var AllPHypemNowSongs = spv.inh(HypemPlaylist, {}, {

	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['hypem', 'get', function(opts) {
			var path = '/playlist/popular/3day/json/' + opts.paging.next_page +'/data.js';
			return [path, null];
		}]
	]

});
// var AllPHypemWeekSongs = function() {};
// HypemPlaylist.extendTo(AllPHypemWeekSongs, {
// 	'nest_req-songs-list': [
// 		declr_parsers.hypem.tracks,
// 		['hypem', 'get', function(opts) {
// 			var path = '/playlist/popular/lastweek/json/' + opts.paging.next_page +'/data.js';
// 			return [path, null];
// 		}]
// 	]
// });

var AllPSongsChart = spv.inh(SongsList, {}, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['lfm', 'get', function() {
			return ['chart.getTopTracks', null];
		}]
	]
});

var AllPSongsHyped = spv.inh(SongsList, {}, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['lfm', 'get', function() {
			return ['chart.getHypedTracks', null];
		}]
	]
});

var AllPSongsLoved = spv.inh(SongsList, {}, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['lfm', 'get', function() {
			return ['chart.getLovedTracks', null];
		}]
	]
});



var AllPlacesSongsLists = spv.inh(BrowseMap.Model, {}, {
	'nest-lists_list':[['latest', 'latest:remix', 'topnow_hypem', '_', 'hyped', 'loved'], true],
	sub_page: {
		latest: {
			constr: AllPHypemLatestSongs,
			title: [['#locales.Latest Blogged music from hypem_com']]
		},
		'latest:remix': {
			constr: AllPHypemLatestRemixesSongs,
			title: [['#locales.Latest Blogged remixes from hypem_com']]
		},
		'topnow_hypem': {
			constr: AllPHypemNowSongs,
			title: [['#locales.Popular Now on hypem_com']]
		},
		'_': {
			constr: AllPSongsChart,
			title: [['#locales.Top']]
		},
		'hyped': {
			constr: AllPSongsHyped,
			title: [['#locales.Hyped']]
		},
		'loved': {
			constr: AllPSongsLoved,
			title: [['#locales.Most Loved']]
		}
	},
	model_name: 'songs_lists'
});


var AllPArtistsHyped = spv.inh(ArtistsList, {}, {
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('artists'),
		['lfm', 'get', function() {
			return ['chart.getHypedArtists', null];
		}]
	]
});

var AllPArtistsChart = spv.inh(ArtistsList, {}, {
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('artists'),
		['lfm', 'get', function() {
			return ['chart.getTopArtists', null];
		}]
	]
});


var AllPlacesArtistsLists = spv.inh(BrowseMap.Model, {}, {
	'nest-lists_list':[ ['hyped', '_'], true],
	model_name: 'artists_lists',
	sub_page: {
		'_': {
			constr: AllPArtistsChart,
			title: [['#locales.Top']]
		},
		'hyped': {
			constr: AllPArtistsHyped,
			title: [['#locales.Hyped']]
		}
	}

});



var AllPlaces = spv.inh(BrowseMap.Model, {}, {
	model_name:'allplaces',
	'nest-songs_lists': ['songs'],
	'nest-artists_lists': ['artists'],
	'nest-lists_list': [['songs', 'artists']],
	sub_page: {
		'songs': {
			constr: AllPlacesSongsLists,
			title: [['#locales.Songs']]
		},
		'artists': {
			constr: AllPlacesArtistsLists,
			title: [['#locales.Artists']]
		}/*,
		'blogs': {
			constr: MusicBlog.BlogsConductor,
			title: 'Blogs'
		}*/
	}
});

var metroP = function(md) {
	return {
		metro: md.head.city_name,
		country: md.head.country_name
	};
};

var CityAritstsTop = spv.inh(ArtistsList, {}, {
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['geo.getMetroArtistChart', metroP(this)];
		}]
	]
});
var CityArtistsHype = spv.inh(ArtistsList, {}, {
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['geo.getMetroHypeArtistChart', metroP(this)];
		}]
	]
});
var CityArtistsUnique = spv.inh(ArtistsList, {}, {

	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['geo.getMetroUniqueArtistChart', metroP(this)];
		}]
	]
});

var CityArtistsLists = spv.inh(BrowseMap.Model, {}, {
	model_name: 'artists_lists',
	'nest-lists_list':[ ['_', 'hyped', 'unique'], true ],
	sub_page: {
		'_': {
			constr: CityAritstsTop,
			title: [['#locales.Top']]
		},
		'hyped': {
			constr: CityArtistsHype,
			title: [['#locales.Hyped']]
		},
		'unique': {
			constr: CityArtistsUnique,
			title: [['#locales.Unique']]
		}
	}
});


var CitySongsTop = spv.inh(SongsList, {}, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['geo.getMetroTrackChart', metroP(this)];
		}]
	]
});
var CitySongsHype = spv.inh(SongsList, {}, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['geo.getMetroHypeTrackChart', metroP(this)];
		}]
	]
});
var CitySongsUnique = spv.inh(SongsList, {}, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['geo.getMetroUniqueTrackChart', metroP(this)];
		}]
	]
});

var CitySongsLists = spv.inh(BrowseMap.Model, {}, {
	model_name: 'songs_lists',
	'nest-lists_list':[ ['_', 'hyped', 'unique'], true ],
	sub_page: {
		'_': {
			constr: CitySongsTop,
			title: [['#locales.Top']]
		},
		'hyped': {
			constr: CitySongsHype,
			title: [['#locales.Hyped']]
		},
		'unique': {
			constr: CitySongsUnique,
			title: [['#locales.Unique']]
		}
	}
});

var CityPlace = spv.inh(BrowseMap.Model, {}, {
	model_name: 'city_place',
	hp_bound: {
		country_name: null,
		city_name: null
	},
	data_by_hp: true,
	'nest-lists_list': [['artists', 'songs']],
	sub_page: {
		'artists': {
			constr: CityArtistsLists,
			title: [['#locales.Artists lists']]
		},
		'songs': {
			constr: CitySongsLists,
			title: [['#locales.Songs lists']]
		}
	}
});



var CountryCitiesList = spv.inh(BrowseMap.Model, {}, {
	model_name: 'cities_list',

	'compx-parent_focus': parent_focus,
	'stch-parent_focus': heavyInitReactn,

	'stch-mp_has_focus': heavyInitReactn,

	data_by_hp: true,
	heavyInit: function() {
		if (this.heavy_inited){
			return;
		}
		this.heavy_inited = true;

		var lists_list = [];

		var citiesl = lastfm_data.сountries[this.head.country_name];

		for (var i = 0; i < citiesl.length; i++) {
			var name = citiesl[i];
			var instance = this.getSPI(name, true);
			lists_list.push(instance);
		}

		pv.updateNesting(this, 'lists_list', lists_list);
	},
	'nest_posb-lists_list': [CityPlace],
	//'nest-lists_list': [],
	getSPC: function() {
		return CityPlace;
	},
	subPager: function(sub_path_string){
		var page_name = spv.capitalize(sub_path_string);
		if (!this.sub_pages[page_name]) {
			var Constr = this.getSPC();
			var instance = this.initSi(Constr, {
				states: {
					nav_title: page_name + ', ' + this.head.country_name,
					url_part: '/' + sub_path_string,
				},
				head: {
					city_name: page_name
				}
			});
			this.sub_pages[page_name] = instance;
		}
		return this.sub_pages[page_name];

	}
});

var CountryTopArtists = spv.inh(ArtistsList, {}, {
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['geo.getTopArtists', {
				country: this.head.country_name
			}];
		}]
	]
});
var CountryTopSongs = spv.inh(SongsList, {}, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['geo.getTopTracks', {
				country: this.head.country_name
			}];
		}]
	]
});

var CountryPlace = spv.inh(BrowseMap.Model, {}, {
	model_name: 'country_place',

	'compx-parent_focus': parent_focus,
	'stch-parent_focus': heavyInitReactn,

	'stch-mp_has_focus': heavyInitReactn,

	'nest-lists_list':[ ['artists_top', 'songs_top', 'cities'], false, 'mp_alhf' ],
	'nest-pwis':[ ['artists_top', 'songs_top'], true, 'mp_alhf' ],
	sub_page: {
		'songs_top': {
			constr: CountryTopSongs,
			title: [['#locales.Top Songs']]
		},
		'artists_top': {
			constr: CountryTopArtists,
			title: [['#locales.Top Artists']]
		},
		'cities': {
			constr: CountryCitiesList,
			title: [
				['#locales.Cities of %country%', 'country_name'],
				function(state, country_name) {
					return state && state.replace('%country%', country_name);
				}
			]
		}
	},
	heavyInit: function() {
		if (this.heavy_inited){
			return;
		} else {
			this.heavy_inited = true;
			pv.update(this, 'mp_alhf', true);
		}
	}
});

var CountriesList = spv.inh(BrowseMap.Model, {
	init: function(target) {
		var lists_list = [];
		for (var country in lastfm_data.сountries){
			var country_place = target.getSPI(country, true);
			lists_list.push(country_place);
		}
		pv.updateNesting(target, 'lists_list', lists_list);
	}
}, {
	model_name: 'сountries_list',
	'nest_posb-lists_list': [CountryPlace],
	getSPC: function() {
		return CountryPlace;
	},
	subPager: function(sub_path_string){
		var page_name = spv.capitalize(sub_path_string);
		if (!this.sub_pages[page_name]){
			var Constr = this.getSPC();
			var instance = this.initSi(Constr, {
				states: {
					nav_title: page_name,
					url_part: '/' + sub_path_string
				},
				head: {
					country_name: page_name
				}
			});
			this.sub_pages[page_name] = instance;
		}
		return this.sub_pages[page_name];

	}
});



MusicConductor = spv.inh(BrowseMap.Model, {}, {
	model_name: 'mconductor',
	'compx-can_expand': [
		['^can_expand'],
		function (can_expand) {
			return can_expand;
		}
	],
	'compx-can_load_previews': [
		['^mp_has_focus'],
		function(parent_focus) {
			return !!parent_focus;
		}
	],
	'compx-preview_images': [
		['@selected_image:preview_playlists.songs-list'],
		function(images) {
			if (!images) {return;}

			var index = {};
			var result = [];

			for (var i = 0; i < images.length; i++) {
				var cur = images[i];
				if (!cur) {continue;}

				var id = cur.lfm_id || cur.url;
				if (index.hasOwnProperty(id)) {continue;}
				index[id] = true;

				result.push(cur);
			}

			return result;
		}
	],
	'nest-preview_playlists': [['world/songs/topnow_hypem', 'world/songs/_'], 'can_load_previews'],
	'nest-preview_list':
		[['world/songs', 'world/songs/topnow_hypem', 'world/songs/_', 'world/artists', 'world']],
	'nest-allpas': ['world'],
	'nest-сountries': ['сountries'],
	sub_page: {
		сountries: {
			title: [['#locales.Countries']],
			constr: CountriesList
		},
		world: {
			constr: AllPlaces,
			title: [['#locales.All-a-world']]
		}
	}
});
return MusicConductor;
});
