define(['spv', 'app_serv','./SongsList', './ArtCard', 'js/libs/BrowseMap', 'js/lastfm_data'],function (spv, app_serv, SongsList, ArtCard, BrowseMap, lastfm_data){
"use strict";
var MusicConductor;
//http://hypem.com/latest
var HypemPlaylist = SongsList.HypemPlaylist;
var ArtistsList = ArtCard.ArtistsList;
var localize = app_serv.localize;
var AllPHypemLatestSongs = function() {};
HypemPlaylist.extendTo(AllPHypemLatestSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendHypemDataRequest(paging_opts, request_info, {
			path: '/playlist/latest/all/json/' + paging_opts.next_page +'/data.js',
			parser: this.getHypemTracksList,
			data: this.send_params
		});
	}
});
var AllPHypemLatestRemixesSongs = function() {};
HypemPlaylist.extendTo(AllPHypemLatestRemixesSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendHypemDataRequest(paging_opts, request_info, {
			path: '/playlist/latest/remix/json/' + paging_opts.next_page +'/data.js',
			parser: this.getHypemTracksList,
			data: this.send_params
		});
	}
});

var AllPHypemNowSongs = function() {};
HypemPlaylist.extendTo(AllPHypemNowSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendHypemDataRequest(paging_opts, request_info, {
			path: '/playlist/popular/3day/json/' + paging_opts.next_page +'/data.js',
			parser: this.getHypemTracksList,
			data: this.send_params
		});
	}
});
var AllPHypemWeekSongs = function() {};
HypemPlaylist.extendTo(AllPHypemWeekSongs, {
	init: function(opts) {
		this._super(opts);
		this.updateManyStates({
			'nav_title': 'Popular last Week on hypem.com',
			'url_part': '/topweek_hypem'
		});
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendHypemDataRequest(paging_opts, request_info, {
			path: '/playlist/popular/lastweek/json/' + paging_opts.next_page +'/data.js',
			parser: this.getHypemTracksList,
			data: this.send_params
		});
	}
});



var AllPSongsChart = function() {};
SongsList.extendTo(AllPSongsChart, {
	init: function(opts) {
		this._super(opts);
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'chart.getTopTracks',
			field_name: 'tracks.track',
			parser: this.getLastfmTracksList
		});
	}
});
var AllPSongsHyped = function() {};
SongsList.extendTo(AllPSongsHyped, {
	init: function(opts) {
		this._super(opts);
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'chart.getHypedTracks',
			field_name: 'tracks.track',
			parser: this.getLastfmTracksList
		});
	}
});

var AllPSongsLoved = function() {};
SongsList.extendTo(AllPSongsLoved, {
	init: function(opts) {
		this._super(opts);
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'chart.getLovedTracks',
			field_name: 'tracks.track',
			parser: this.getLastfmTracksList
		});
	}
});



var AllPlacesSongsLists = function() {};
BrowseMap.Model.extendTo(AllPlacesSongsLists, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.lists_list = ['latest', 'latest:remix', 'topnow_hypem', '_', 'hyped', 'loved'];
		this.initSubPages(this.lists_list);

		this.updateNesting('lists_list', this.lists_list);
		this.bindChildrenPreload();

	},
	sub_pa: {
		latest: {
			constr: AllPHypemLatestSongs,
			title: 'Latest Blogged music from hypem.com'
		},
		'latest:remix': {
			constr: AllPHypemLatestRemixesSongs,
			title: 'Latest Blogged remixes from hypem.com'
		},
		'topnow_hypem': {
			constr: AllPHypemNowSongs,
			title: 'Popular Now on hypem.com'
		},
		'_': {
			constr: AllPSongsChart,
			title: localize('Top')
		},
		'hyped': {
			constr: AllPSongsHyped,
			title: 'Hyped'
		},
		'loved': {
			constr: AllPSongsLoved,
			title: 'Most Loved'
		}
	},
	model_name: 'songs_lists'
});

var AllPHypemWeekArtists = function() {};
//ArtistsList.extendTo()

var AllPArtistsHyped = function() {};
ArtistsList.extendTo(AllPArtistsHyped, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'chart.getHypedArtists',
			field_name: 'artists.artist',
			parser: this.getLastfmArtistsList
		});
	}
});

var AllPArtistsChart = function() {};
ArtistsList.extendTo(AllPArtistsChart, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'chart.getTopArtists',
			field_name: 'artists.artist',
			parser: this.getLastfmArtistsList
		});
	}
});


var AllPlacesArtistsLists = function() {};
BrowseMap.Model.extendTo(AllPlacesArtistsLists, {
	init: function(opts) {
		this._super(opts);
		this.initStates();

		this.lists_list = ['hyped', '_'];
		this.initSubPages(this.lists_list);

		this.updateNesting('lists_list', this.lists_list);
		this.bindChildrenPreload();
	},
	model_name: 'artists_lists',
	sub_pa: {
		'_': {
			constr: AllPArtistsChart,
			title: localize('Top')
		},
		'hyped': {
			constr: AllPArtistsHyped,
			title: 'Hyped'
		}
	}

});


var AllPlaces = function() {};
BrowseMap.Model.extendTo(AllPlaces, {
	model_name:'allplaces',
	init: function(opts) {
		this._super.apply(this, arguments);


		this.songs_lists = this.getSPI('songs', true);
		this.updateNesting('songs_lists', this.songs_lists);

		this.artists_lists = this.getSPI('artists', true);
		this.updateNesting('artists_lists', this.artists_lists);
		this.updateNesting('lists_list', [this.artists_lists, this.songs_lists]);

		this.initStates();


	},
	sub_pa: {
		'songs': {
			constr: AllPlacesSongsLists,
			title: localize('Songs')
		},
		'artists': {
			constr: AllPlacesArtistsLists,
			title: localize('Artists')
		}
	}
});

var CityAritstsTop = function() {};
ArtistsList.extendTo(CityAritstsTop, {
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.initStates();
	},
	getRqData: function() {
		return {
			metro: this.city_name,
			country: this.country_name
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'geo.getMetroArtistChart',
			field_name: 'topartists.artist',
			parser: this.getLastfmArtistsList,
			data: this.getRqData()
		});
	}
});
var CityArtistsHype = function() {};
ArtistsList.extendTo(CityArtistsHype, {
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.initStates();
	},
	getRqData: function() {
		return {
			metro: this.city_name,
			country: this.country_name
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'geo.getMetroHypeArtistChart',
			field_name: 'topartists.artist',
			parser: this.getLastfmArtistsList,
			data: this.getRqData()
		});
	}
});
var CityArtistsUnique = function() {};
ArtistsList.extendTo(CityArtistsUnique, {
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.initStates();
	},
	getRqData: function() {
		return {
			metro: this.city_name,
			country: this.country_name
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'geo.getMetroUniqueArtistChart',
			field_name: 'topartists.artist',
			parser: this.getLastfmArtistsList,
			data: this.getRqData()
		});
	}
});

var CityArtistsLists = function() {};
BrowseMap.Model.extendTo(CityArtistsLists, {
	model_name: 'artists_lists',
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.initStates();

		this.sub_pa_params = {
			city_name: this.city_name,
			country_name: this.country_name
		};

		this.lists_list = ['_', 'hyped', 'unique'];
		this.initSubPages(this.lists_list);
		this.updateNesting('lists_list', this.lists_list);
		this.bindChildrenPreload();
	},
	sub_pa: {
		'_': {
			constr: CityAritstsTop,
			title: localize('Top')
		},
		'hyped': {
			constr: CityArtistsHype,
			title: 'Hyped'
		},
		'unique': {
			constr: CityArtistsUnique,
			title: 'Unique'
		}
	}
});


var CitySongsTop = function() {};
SongsList.extendTo(CitySongsTop,{
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'geo.getMetroTrackChart',
			field_name: 'toptracks.track',
			parser: this.getLastfmTracksList,
			data: {
				metro: this.city_name,
				country: this.country_name
			}
		});
	}
});
var CitySongsHype = function() {};
SongsList.extendTo(CitySongsHype,{
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'geo.getMetroHypeTrackChart',
			field_name: 'toptracks.track',
			parser: this.getLastfmTracksList,
			data: {
				metro: this.city_name,
				country: this.country_name
			}
		});
	}
});
var CitySongsUnique = function() {};
SongsList.extendTo(CitySongsUnique,{
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'geo.getMetroUniqueTrackChart',
			field_name: 'toptracks.track',
			parser: this.getLastfmTracksList,
			data: {
				metro: this.city_name,
				country: this.country_name
			}
		});
	}
});

var CitySongsLists = function() {};
BrowseMap.Model.extendTo(CitySongsLists, {
	model_name: 'songs_lists',
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.initStates();
		this.sub_pa_params = {
			country_name: this.country_name,
			city_name: this.city_name
		};
		this.lists_list = ['_', 'hyped', 'unique'];
		this.initSubPages(this.lists_list);
		this.updateNesting('lists_list', this.lists_list);
		this.bindChildrenPreload();
	},
	sub_pa: {
		'_': {
			constr: CitySongsTop,
			title: localize('Top')
		},
		'hyped': {
			constr: CitySongsHype,
			title: 'Hyped'
		},
		'unique': {
			constr: CitySongsUnique,
			title: 'Unique'
		}
	}
});

var CityPlace = function() {};
BrowseMap.Model.extendTo(CityPlace, {
	model_name: 'city_place',
	init: function(opts, params) {
		this._super(opts);
		this.country_name = params.country_name;
		this.city_name = params.city_name;
		this.initStates();

		this.sub_pa_params = {
			country_name: this.country_name,
			city_name: this.city_name
		};

		this.lists_list = ['artists', 'songs'];
		this.initSubPages(this.lists_list);

		this.updateNesting('lists_list', this.lists_list);
	},
	sub_pa: {
		'artists': {
			constr: CityArtistsLists,
			title: "Artists lists"
		},
		'songs': {
			constr: CitySongsLists,
			title: "Songs lists"
		}
	}
});

var CountryCitiesList = function() {};
BrowseMap.Model.extendTo(CountryCitiesList, {
	model_name: 'cities_list',
	init: function(opts, params) {
		this._super(opts);
		this.country_name = params.country_name;
		this.initStates();
		

		var _this = this;
		this.map_parent.on('state_change-mp_show', function(e) {
			if (e.value && e.value.userwant){
				_this.heavyInit();
			}
		});
	},
	heavyInit: function() {
		if (this.heavy_inited){
			return;
		}
		this.heavy_inited = true;

		var lists_list = [];

		var citiesl = lastfm_data.сountries[this.country_name];

		for (var i = 0; i < citiesl.length; i++) {
			var name = citiesl[i];
			var instance = this.getSPI(name);
			instance.initOnce();
			lists_list.push(instance);
		}
		
		this.updateNesting('lists_list', lists_list);
	},
	subPager: function(sub_path_string){
		var page_name = spv.capitalize(sub_path_string);
		if (this.sub_pages[page_name]){
			return this.sub_pages[page_name];
		} else {
			var instance = new CityPlace();
			instance.init_opts = [{
				app: this.app,
				map_parent: this,
				nav_opts: {
					nav_title: page_name + ', ' + this.country_name,
					url_part: '/' + sub_path_string
				}
			}, {country_name: this.country_name, city_name: page_name}];
			return this.sub_pages[page_name] = instance;
		}

	}
});

var CountryTopArtists = function() {};
ArtistsList.extendTo(CountryTopArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.country_name = params.country_name;
		this.initStates();
	},
	getRqData: function() {
		return {
			country: this.country_name
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'geo.getTopArtists',
			field_name: 'topartists.artist',
			data: this.getRqData(),
			parser: this.getLastfmArtistsList
		});
	}
});
var CountryTopSongs = function() {};
SongsList.extendTo(CountryTopSongs, {
	init: function(opts, params) {
		this._super(opts);
		this.country_name = params.country_name;
		this.initStates();
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'geo.getTopTracks',
			field_name: 'toptracks.track',
			data: {
				country: this.country_name
			},
			parser: this.getLastfmTracksList
		});
	}
});
var CountryPlace = function() {};
BrowseMap.Model.extendTo(CountryPlace, {
	model_name: 'country_place',
	init: function(opts, params) {
		this._super(opts);
		this.country_name = params.country_name;
		this.initStates();
		this.sub_pa_params = {country_name: this.country_name};

		this.on('state_change-mp_show', function(e) {
			if (e.value && e.value.userwant){
				this.heavyInit();
			}
		});
		var _this = this;
		this.map_parent.on('state_change-mp_show', function(e) {
			if (e.value && e.value.userwant){
				_this.heavyInit();
			}
		});

			
	},
	sub_pa: {
		'songs_top': {
			constr: CountryTopSongs,
			title: 'Top Songs'
		},
		'artists_top': {
			constr: CountryTopArtists,
			title: 'Top Artists'
		},
		'cities': {
			constr: CountryCitiesList,
			getTitle: function() {
				return 'Cities of ' + this.country_name;
			}
		}
	},
	heavyInit: function() {
		if (this.heavy_inited){
			return;
		} else {
			this.heavy_inited = true;
		}
		var artists_top = this.getSPI('artists_top');
		var songs_top = this.getSPI('songs_top');
		this.lists_list = [artists_top, songs_top, this.getSPI('cities')];
		this.initSubPages(['artists_top', 'songs_top', 'cities']);


		this.updateNesting('lists_list', this.lists_list);
		this.bindChildrenPreload([this.getSPI('artists_top'), this.getSPI('songs_top')]);
	}
});

var CountriesList = function() {};
BrowseMap.Model.extendTo(CountriesList, {
	model_name: 'сountries_list',
	init: function(opts) {
		this._super.apply(this, arguments);
		this.lists_list = [];
		for (var country in lastfm_data.сountries){
			var country_place = this.getSPI(country);
			country_place.initOnce();
			this.lists_list.push(country_place);
		}
		this.updateNesting('lists_list', this.lists_list);
		this.initStates();
		
	},
	subPager: function(sub_path_string){
		var page_name = spv.capitalize(sub_path_string);
		if (this.sub_pages[page_name]){
			return this.sub_pages[page_name];
		} else {
			var instance = new CountryPlace();
			instance.init_opts = [{
				app: this.app,
				map_parent: this,
				nav_opts: {
					nav_title: page_name,
					url_part: '/' + sub_path_string
				}
			}, {country_name: page_name}];
			return this.sub_pages[page_name] = instance;
		}

	}
});


MusicConductor = function() {};
BrowseMap.Model.extendTo(MusicConductor, {
	model_name: 'mconductor',
	init: function(opts) {
		this._super.apply(this, arguments);

		this.allpas = this.getSPI('world');
		this.сountries = this.getSPI('сountries');


		var _this = this;
		this.allpas.initOnce();
		this.updateNesting('allpas', this.allpas);

		this.сountries.initOnce();
		this.updateNesting('сountries', this.сountries);



		
		this.initStates();
		this.map_parent.on('state_change-can_expand', function(e) {
			_this.updateState('can_expand', e.value);
		});
		return this;
	},
	sub_pa: {
		сountries: {
			title: 'Countries',
			constr: CountriesList
		},
		world: {
			constr: AllPlaces,
			title: 'All around the World'
		}
	}
});
return MusicConductor;
});