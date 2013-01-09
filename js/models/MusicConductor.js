var ArtistsList = function() {};
mapLevelModel.extendTo(ArtistsList, {
	requestArtists: function() {

	},
	generatePlaylist: function() {

	}
});


var AllPAllTimeChart = function() {};
EnhancedSongslist.extendTo(AllPAllTimeChart, {
	init: function() {
		this._super.apply(this, arguments);
		//mp: 'url-part', 'nav-title'
		this.updateState('nav-title', 'Популярные за всё время');
		this.updateState('url-part', '/_');
	},
	requestMoreSongs: function(paging_opts) {
		var request_info = {};
		var _this = this;

		request_info.request = 55;

		return request_info;
	}
});


var SongsWagon = function() {};
mapLevelModel.extendTo(SongsWagon, {
	init: function(opts) {
		this._super.apply(this, arguments);
		this.app = opts.app;

		var PI = function() {
			this.allp_allt_cart = new AllPAllTimeChart();
			this.allp_allt_cart.init({
				app: this.app
			});
		};

		var _this = this;
		jsLoadComplete({
			test: function() {
				return _this.app.p && _this.app.mp3_search;
			},
			fn: function() {
				PI.call(_this);
			}
		});
		
		this.updateState('nav-title', 'Композиции');
		this.updateState('url-part', '/songs');
	}
});

var ArtistsWagon = function() {};
mapLevelModel.extendTo(ArtistsWagon, {

});

var TagsWagon = function() {};
mapLevelModel.extendTo(TagsWagon, {

});




var AllPlacesTrain = function() {};
mapLevelModel.extendTo(AllPlacesTrain, {
	init: function(opts) {
		this._super.apply(this, arguments);
		this.app = opts.app;
		this.wagn_songs = new SongsWagon();
		this.wagn_songs.init({
			app: this.app
		});
		this.updateState('nav-title', 'Во всем мире');
		this.updateState('url-part', '/all-places');

	}
});

var CountryTrain = function() {};
mapLevelModel.extendTo(CountryTrain, {

});

var CityTrain = function() {};
mapLevelModel.extendTo(CityTrain, function() {

});

var MusicConductor = function() {};
mapLevelModel.extendTo(MusicConductor, {
	modelname: 'mconductor',
	permanent_md: true,
	init: function(opts) {
		this._super.apply(this, arguments);
		this.app = opts.app;

		this.allp_trn = new AllPlacesTrain();
		this.allp_trn.init({app: this.app});
		this.setChild('allp_wagn', this.allp_trn);

		this.updateState('nav-title', 'Музыкальный кондуктор');
		this.updateState('url-part', '/conductor');
		//world_part
		//countres
		//mp: 'url-part', 'nav-title'
		return this;
	}
});
