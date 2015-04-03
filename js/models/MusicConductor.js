define(['spv', 'app_serv','./SongsList', './ArtCard', 'js/libs/BrowseMap', 'js/lastfm_data', 'js/modules/declr_parsers', 'pv'],
function (spv, app_serv, SongsList, ArtCard, BrowseMap, lastfm_data, declr_parsers, pv){
"use strict";
var MusicConductor;
//http://hypem.com/latest
var HypemPlaylist = SongsList.HypemPlaylist;
var ArtistsList = ArtCard.ArtistsList;
var localize = app_serv.localize;
var AllPHypemLatestSongs = function() {};
HypemPlaylist.extendTo(AllPHypemLatestSongs, {

	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['hypem', 'get', function(opts) {
			var path = '/playlist/latest/all/json/' + opts.paging.next_page +'/data.js';
			return [path, null];
		}]
	],
	page_limit: 30
});
var AllPHypemLatestRemixesSongs = function() {};
HypemPlaylist.extendTo(AllPHypemLatestRemixesSongs, {

	'nest_req-songs-list': [
		declr_parsers.hypem.tracks,
		['hypem', 'get', function(opts) {
			var path = '/playlist/latest/remix/json/' + opts.paging.next_page +'/data.js';
			return [path, null];
		}]
	]
});

var AllPHypemNowSongs = function() {};
HypemPlaylist.extendTo(AllPHypemNowSongs, {

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



var AllPSongsChart = function() {};
SongsList.extendTo(AllPSongsChart, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['lfm', 'get', function() {
			return ['chart.getTopTracks', null];
		}]
	]
});
var AllPSongsHyped = function() {};
SongsList.extendTo(AllPSongsHyped, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['lfm', 'get', function() {
			return ['chart.getHypedTracks', null];
		}]
	]
});

var AllPSongsLoved = function() {};
SongsList.extendTo(AllPSongsLoved, {
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['lfm', 'get', function() {
			return ['chart.getLovedTracks', null];
		}]
	]
});



var AllPlacesSongsLists = function() {};
BrowseMap.Model.extendTo(AllPlacesSongsLists, {
	'nest-lists_list':[['latest', 'latest:remix', 'topnow_hypem', '_', 'hyped', 'loved'], true],
	sub_pa: {
		latest: {
			constr: AllPHypemLatestSongs,
			title: localize('Latest Blogged music from hypem.com')
		},
		'latest:remix': {
			constr: AllPHypemLatestRemixesSongs,
			title: localize('Latest Blogged remixes from hypem.com')
		},
		'topnow_hypem': {
			constr: AllPHypemNowSongs,
			title: localize('Popular Now on hypem.com')
		},
		'_': {
			constr: AllPSongsChart,
			title: localize('Top')
		},
		'hyped': {
			constr: AllPSongsHyped,
			title: localize('Hyped')
		},
		'loved': {
			constr: AllPSongsLoved,
			title: localize('Most Loved')
		}
	},
	model_name: 'songs_lists'
});

var AllPHypemWeekArtists = function() {};
//ArtistsList.extendTo()

var AllPArtistsHyped = function() {};
ArtistsList.extendTo(AllPArtistsHyped, {
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('artists'),
		['lfm', 'get', function() {
			return ['chart.getHypedArtists', null];
		}]
	]
});

var AllPArtistsChart = function() {};
ArtistsList.extendTo(AllPArtistsChart, {
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('artists'),
		['lfm', 'get', function() {
			return ['chart.getTopArtists', null];
		}]
	]
});


var AllPlacesArtistsLists = function() {};
BrowseMap.Model.extendTo(AllPlacesArtistsLists, {
	'nest-lists_list':[ ['hyped', '_'], true],
	model_name: 'artists_lists',
	sub_pa: {
		'_': {
			constr: AllPArtistsChart,
			title: localize('Top')
		},
		'hyped': {
			constr: AllPArtistsHyped,
			title: localize('Hyped')
		}
	}

});



var AllPlaces = function() {};
BrowseMap.Model.extendTo(AllPlaces, {
	model_name:'allplaces',
	'nest-songs_lists': ['songs'],
	'nest-artists_lists': ['artists'],
	'nest-lists_list': [['songs', 'artists']],
	sub_pa: {
		'songs': {
			constr: AllPlacesSongsLists,
			title: localize('Songs')
		},
		'artists': {
			constr: AllPlacesArtistsLists,
			title: localize('Artists')
		}/*,
		'blogs': {
			constr: MusicBlog.BlogsConductor,
			title: 'Blogs'
		}*/
	}
});

var CityAritstsTop = function() {};
ArtistsList.extendTo(CityAritstsTop, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
	},
	getRqData: function() {
		return {
			metro: this.city_name,
			country: this.country_name
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['geo.getMetroArtistChart', this.getRqData()];
		}]
	]
});
var CityArtistsHype = function() {};
ArtistsList.extendTo(CityArtistsHype, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
	},
	getRqData: function() {
		return {
			metro: this.city_name,
			country: this.country_name
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['geo.getMetroHypeArtistChart', this.getRqData()];
		}]
	]
});
var CityArtistsUnique = function() {};
ArtistsList.extendTo(CityArtistsUnique, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
	},
	getRqData: function() {
		return {
			metro: this.city_name,
			country: this.country_name
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['geo.getMetroUniqueArtistChart', this.getRqData()];
		}]
	]
});

var CityArtistsLists = function() {};
BrowseMap.Model.extendTo(CityArtistsLists, {
	model_name: 'artists_lists',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.city_name = params.city_name;
		this.country_name = params.country_name;

		this.sub_pa_params = {
			city_name: this.city_name,
			country_name: this.country_name
		};


	},
	'nest-lists_list':[ ['_', 'hyped', 'unique'], true ],
	sub_pa: {
		'_': {
			constr: CityAritstsTop,
			title: localize('Top')
		},
		'hyped': {
			constr: CityArtistsHype,
			title: localize('Hyped')
		},
		'unique': {
			constr: CityArtistsUnique,
			title: localize('Unique')
		}
	}
});


var CitySongsTop = function() {};
SongsList.extendTo(CitySongsTop,{
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['geo.getMetroTrackChart', {
				metro: this.city_name,
				country: this.country_name
			}];
		}]
	]
});
var CitySongsHype = function() {};
SongsList.extendTo(CitySongsHype,{
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['geo.getMetroHypeTrackChart', {
				metro: this.city_name,
				country: this.country_name
			}];
		}]
	]
});
var CitySongsUnique = function() {};
SongsList.extendTo(CitySongsUnique,{
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['geo.getMetroUniqueTrackChart', {
				metro: this.city_name,
				country: this.country_name
			}];
		}]
	]
});

var CitySongsLists = function() {};
BrowseMap.Model.extendTo(CitySongsLists, {
	model_name: 'songs_lists',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.sub_pa_params = {
			country_name: this.country_name,
			city_name: this.city_name
		};

	},
	'nest-lists_list':[ ['_', 'hyped', 'unique'], true ],
	sub_pa: {
		'_': {
			constr: CitySongsTop,
			title: localize('Top')
		},
		'hyped': {
			constr: CitySongsHype,
			title: localize('Hyped')
		},
		'unique': {
			constr: CitySongsUnique,
			title: localize('Unique')
		}
	}
});

var CityPlace = function() {};
BrowseMap.Model.extendTo(CityPlace, {
	model_name: 'city_place',
	hp_bound: {
		country_name: null,
		city_name: null
	},
	data_by_hp: true,
	'nest-lists_list': [['artists', 'songs']],
	sub_pa: {
		'artists': {
			constr: CityArtistsLists,
			title: localize("Artists lists")
		},
		'songs': {
			constr: CitySongsLists,
			title: localize("Songs lists")
		}
	}
});

var CountryCitiesList = function() {};
BrowseMap.Model.extendTo(CountryCitiesList, {
	model_name: 'cities_list',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.country_name = params.country_name;		

		var _this = this;
		this.map_parent.on('state_change-mp_has_focus', function(e) {
			if (e.value){
				_this.heavyInit();
			}
		});
	},
	hp_bound: {
		country_name: null
	},
	data_by_hp: true,
	heavyInit: function() {
		if (this.heavy_inited){
			return;
		}
		this.heavy_inited = true;

		var lists_list = [];

		var citiesl = lastfm_data.сountries[this.head_props.country_name];

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
		if (this.sub_pages[page_name]){
			return this.sub_pages[page_name];
		} else {
			var Constr = this.getSPC();
			var instance = new Constr();
			this.sub_pages[page_name] = instance;

			return [instance, {
				nav_title: page_name + ', ' + this.head_props.country_name,
				url_part: '/' + sub_path_string,
				country_name: this.head_props.country_name,
				city_name: page_name
			}];
		}

	}
});

var CountryTopArtists = function() {};
ArtistsList.extendTo(CountryTopArtists, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.country_name = params.country_name;
	},
	getRqData: function() {
		return {
			country: this.country_name
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['geo.getTopArtists', this.getRqData()];
		}]
	]
});
var CountryTopSongs = function() {};
SongsList.extendTo(CountryTopSongs, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.country_name = params.country_name;
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['geo.getTopTracks', {
				country: this.country_name

			}];
		}]
	]
});
var CountryPlace = function() {};
BrowseMap.Model.extendTo(CountryPlace, {
	model_name: 'country_place',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		//this.country_name = params.country_name;

		this.on('state_change-mp_has_focus', function(e) {
			if (e.value){
				this.heavyInit();
			}
		});
		var _this = this;
		this.map_parent.on('state_change-mp_has_focus', function(e) {
			if (e.value){
				_this.heavyInit();
			}
		});

			
	},
	hp_bound: {
		country_name: null
	},
	data_by_hp: true,
	allow_data_init: true,
	'nest-lists_list':[ ['artists_top', 'songs_top', 'cities'], false, 'mp_alhf' ],
	'nest-pwis':[ ['artists_top', 'songs_top'], true, 'mp_alhf' ],
	sub_pa: {
		'songs_top': {
			constr: CountryTopSongs,
			title: localize('Top Songs')
		},
		'artists_top': {
			constr: CountryTopArtists,
			title: localize('Top Artists')
		},
		'cities': {
			constr: CountryCitiesList,
			getTitle: function() {
				return localize('Cities of %country%').replace('%country%', this.head_props.country_name);
			}
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

var CountriesList = function() {};
BrowseMap.Model.extendTo(CountriesList, {
	model_name: 'сountries_list',
	init: function() {
		this._super.apply(this, arguments);
		var lists_list = [];
		for (var country in lastfm_data.сountries){
			var country_place = this.getSPI(country, true);
			lists_list.push(country_place);
		}
		pv.updateNesting(this, 'lists_list', lists_list);
		
	},
	'nest_posb-lists_list': [CountryPlace],
	getSPC: function() {
		return CountryPlace;
	},
	subPager: function(sub_path_string){
		var page_name = spv.capitalize(sub_path_string);
		if (!this.sub_pages[page_name]){
			var Constr = this.getSPC();
			var instance = new Constr();
			this.sub_pages[page_name] = instance;
			return [instance, {
				nav_title: page_name,
				url_part: '/' + sub_path_string,
				country_name: page_name
			}];
		}
		return this.sub_pages[page_name];

	}
});



MusicConductor = function() {};
BrowseMap.Model.extendTo(MusicConductor, {
	model_name: 'mconductor',
	'compx-can_expand': [
		['^can_expand'],
		function (can_expand) {
			return can_expand;
		}
	],
	'compx-can_load_previews': [
		['^mp_has_focus'],
		function(mp_show) {
			return !!mp_show;
		}
	],
	'nest-allpas': ['world'],
	'nest-сountries': ['сountries'],
	'nest-preview_hypem': ['world/songs/topnow_hypem', 'can_load_previews'],
	'nest-preview_lastfm_top': ['world/songs/_', 'can_load_previews'],
	sub_pa: {
		сountries: {
			title: localize('Countries'),
			constr: CountriesList
		},
		world: {
			constr: AllPlaces,
			title: localize('All-a-world')
		}
	}
});
return MusicConductor;
});