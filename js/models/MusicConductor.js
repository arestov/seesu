var MusicConductor;
(function (){
"use strict";

//http://hypem.com/latest

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
songsList.extendTo(AllPSongsChart, {
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
songsList.extendTo(AllPSongsHyped, {
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
songsList.extendTo(AllPSongsLoved, {
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
mapLevelModel.extendTo(AllPlacesSongsLists, {
	init: function(opts, params) {
		this._super(opts);
		this.updateManyStates({
			'nav_title': localize('Songs'),
			'url_part': '/songs'
		});
	
		this.lists_list = ['latest', 'latest:remix', 'topnow_hypem', '_', 'hyped', 'loved'];
		this.initSubPages(this.lists_list);

		this.setChild('lists_list', this.lists_list);
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
mapLevelModel.extendTo(AllPlacesArtistsLists, {
	init: function(opts) {
		this._super(opts);
		this.updateManyStates({
			'nav_title': localize('Artists'),
			'url_part': '/artists'
		});

		this.lists_list = ['hyped', '_'];
		this.initSubPages(this.lists_list);

		this.setChild('lists_list', this.lists_list);
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
mapLevelModel.extendTo(AllPlaces, {
	model_name:'allplaces',
	init: function(opts) {
		this._super.apply(this, arguments);
		this.songs_lists = new AllPlacesSongsLists();
		this.songs_lists.init({
			app: this.app,
			map_parent: this
		});
		this.setChild('songs_lists', this.songs_lists);
		this.artists_lists = new AllPlacesArtistsLists();
		this.artists_lists.init({
			app: this.app,
			map_parent: this
		});
		this.setChild('artists_lists', this.artists_lists);
		this.setChild('lists_list', [this.artists_lists, this.songs_lists]);

		this.initStates();


	}
});

var CityAritstsTop = function() {};
ArtistsList.extendTo(CityAritstsTop, {
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.updateManyStates({
			'nav_title': localize('Top'),
			'url_part': '/_'
		});
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
		this.updateManyStates({
			'nav_title': 'Hyped',
			'url_part': '/hyped'
		});
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
		this.updateManyStates({
			'nav_title': 'Unique',
			'url_part': '/unique'
		});
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
mapLevelModel.extendTo(CityArtistsLists, {
	model_name: 'artists_lists',
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.updateManyStates({
			'nav_title': "Artists lists",
			'url_part': '/artists'
		});
		this.lists_list = [new CityAritstsTop(), new CityArtistsHype(), new CityArtistsUnique()];
		this.initItems(this.lists_list, {
			app: this.app,
			map_parent: this
		}, {
			country_name: this.country_name,
			city_name: this.city_name
		});
		this.setChild('lists_list', this.lists_list);
		this.bindChildrenPreload();
	}
});


var CitySongsTop = function() {};
songsList.extendTo(CitySongsTop,{
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.updateManyStates({
			'nav_title': localize('Top'),
			'url_part': '/_'
		});
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
songsList.extendTo(CitySongsHype,{
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.updateManyStates({
			'nav_title': 'Hyped',
			'url_part': '/hyped'
		});
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
songsList.extendTo(CitySongsUnique,{
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.updateManyStates({
			'nav_title': 'Unique',
			'url_part': '/unique'
		});
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
mapLevelModel.extendTo(CitySongsLists, {
	model_name: 'songs_lists',
	init: function(opts, params) {
		this._super(opts);
		this.city_name = params.city_name;
		this.country_name = params.country_name;
		this.updateManyStates({
			'nav_title': "Songs lists",
			'url_part': '/songs'
		});
		this.lists_list = [new CitySongsTop(), new CitySongsHype(), new CitySongsUnique()];
		this.initItems(this.lists_list, {
			app: this.app,
			map_parent: this
		}, {
			country_name: this.country_name,
			city_name: this.city_name
		});
		this.setChild('lists_list', this.lists_list);
		this.bindChildrenPreload();
	}
});

var CityPlace = function() {};
mapLevelModel.extendTo(CityPlace, {
	model_name: 'city_place',
	init: function(opts, params) {
		this._super(opts);
		this.country_name = params.country_name;
		this.city_name = params.city_name;
		this.updateManyStates({
			'nav_title': this.city_name + ', ' + params.country_name,
			'url_part': '/' + this.city_name
		});
		var artists_lists = new CityArtistsLists();
		var songs_lists = new CitySongsLists();
		this.lists_list = [artists_lists, songs_lists];
		this.initItems(this.lists_list, {
			app: this.app,
			map_parent: this
		}, {
			country_name: this.country_name,
			city_name: this.city_name
		});
		this.setChild('lists_list', this.lists_list);
	}
});

var CountryCitiesList = function() {};
mapLevelModel.extendTo(CountryCitiesList, {
	model_name: 'cities_list',
	init: function(opts, params) {
		this._super(opts);
		this.country_name = params.country_name;
		this.initStates();
		

		var _this = this;
		this.map_parent.on('state-change.mp_show', function(e) {
			if (e.value && e.value.userwant){
				_this.heavyInit();
			}
		});
	},
	heavyInit: function() {
		if (this.heavy_inited){
			return
		}
		this.heavy_inited = true;

		var lists_list = [];

		var citiesl = lastfm_countres[this.country_name];

		for (var i = 0; i < citiesl.length; i++) {
			var name = citiesl[i];
			var instance = this.getSPI(name);
			instance.initOnce();
			lists_list.push(instance);
		}
		
		this.setChild('lists_list', lists_list, true);
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
			}, {country_name: this.country_name, city_name: page_name}]
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
songsList.extendTo(CountryTopSongs, {
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
mapLevelModel.extendTo(CountryPlace, {
	model_name: 'country_place',
	init: function(opts, params) {
		this._super(opts);
		this.country_name = params.country_name;
		this.initStates();
		this.sub_pa_params = {country_name: this.country_name};

		this.on('state-change.mp_show', function(e) {
			if (e.value && e.value.userwant){
				this.heavyInit();
			}
		});
		var _this = this;
		this.map_parent.on('state-change.mp_show', function(e) {
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


		this.setChild('lists_list', this.lists_list, true);
		this.bindChildrenPreload([this.getSPI('artists_top'), this.getSPI('songs_top')]);
	}
});

var CountresList = function() {};
mapLevelModel.extendTo(CountresList, {
	model_name: 'countres_list',
	init: function(opts) {
		this._super.apply(this, arguments);
		this.lists_list = [];
		for (var country in lastfm_countres){
			var country_place = this.getSPI(country);
			country_place.initOnce();
			this.lists_list.push(country_place);
		}
		this.setChild('lists_list', this.lists_list);
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
mapLevelModel.extendTo(MusicConductor, {
	model_name: 'mconductor',
	permanent_md: true,
	init: function(opts) {
		this._super.apply(this, arguments);

		this.allpas = this.getSPI('world');
		this.countres = this.getSPI('countres');


		var _this = this;
		jsLoadComplete({
			test: function() {
				return _this.app.p && _this.app.mp3_search;
			},
			fn: function() {
				(function() {
					this.allpas.initOnce();
					this.setChild('allpas', this.allpas, true);

					this.countres.initOnce();
					this.setChild('countres', this.countres, true);


				}).call(_this);
			}
		});



		
		this.initStates();
		this.map_parent.on('state-change.can_expand', function(e) {
			_this.updateState('can_expand', e.value);
		});
		return this;
	},
	sub_pa: {
		countres: {
			title: 'Countres',
			constr: CountresList
		},
		world: {
			constr: AllPlaces,
			title: 'All around the World'
		}
	}
});
})();