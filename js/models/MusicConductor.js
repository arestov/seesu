

var AllPAllTimeChart = function() {};
EnhancedSongslist.extendTo(AllPAllTimeChart, {
	init: function() {
		this._super.apply(this, arguments);
		//mp: 'url-part', 'nav-title'
		this.updateState('nav-title', 'Популярные');
		this.updateState('url-part', '/chart');
	},
	sendMoreDataRequest: function(paging_opts) {
		var request_info = {};
		var _this = this;

		request_info.request = lfm.get('chart.getTopTracks', {
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		}, {nocache: true})
			.done(function(r){
				//var artists = toRealArray(getTargetField(r, 'recommendations.artist'));
				var track_list = [];
				/*
				if (artists && artists.length) {
					
					for (var i=0, l = Math.min(artists.length, paging_opts.page_limit); i < l; i++) {
						track_list.push({
							artist: artists[i].name,
							lfm_image: {
								array: artists[i].image
							}
						});
					}
				}*/
				_this.putRequestedData(request_info.request, track_list, r.error);
			})
			.fail(function(){
				_this.requestComplete(request_info.request, true);
			}).always(function() {
				request_info.done = true;
			});


		return request_info;
	}
});


var SongsWagon = function() {};
mapLevelModel.extendTo(SongsWagon, {
	model_name: 'songswagon',
	init: function(opts) {
		this._super.apply(this, arguments);
		this.app = opts.app;

		this.allp_allt_cart = new AllPAllTimeChart();
		this.allp_allt_cart.init({
			app: this.app
		});
		this.setChild('allp_allt_cart', this.allp_allt_cart);
		
		this.updateState('nav-title', 'Композиции');
		this.updateState('url-part', '/songs');
	}
});

var ArtistsWagon = function() {};
mapLevelModel.extendTo(ArtistsWagon, {
	model_name: 'artistswagon'
});

var TagsWagon = function() {};
mapLevelModel.extendTo(TagsWagon, {
	model_name: 'tagswagon'
});




var AllPlacesTrain = function() {};
mapLevelModel.extendTo(AllPlacesTrain, {
	model_name:'allptrain',
	init: function(opts) {
		this._super.apply(this, arguments);
		this.app = opts.app;
		this.wagn_songs = new SongsWagon();
		this.wagn_songs.init({
			app: this.app
		});
		this.setChild('wagn_songs', this.wagn_songs);
		this.updateState('nav-title', 'Во всем мире');
		this.updateState('url-part', '/all-places');

	}
});

var CountryTrain = function() {};
mapLevelModel.extendTo(CountryTrain, {
	model_name: 'countytrain'

});

var CityTrain = function() {};
mapLevelModel.extendTo(CityTrain, {
	model_name: 'citytrain'
});

var MusicConductor = function() {};
mapLevelModel.extendTo(MusicConductor, {
	model_name: 'mconductor',
	permanent_md: true,
	init: function(opts) {
		this._super.apply(this, arguments);
		this.app = opts.app;
		this.pmd = opts.pmd;
		

		this.allp_trn = new AllPlacesTrain();



		var _this = this;
		jsLoadComplete({
			test: function() {
				return _this.app.p && _this.app.mp3_search;
			},
			fn: function() {
				(function() {
					this.allp_trn.init({app: this.app});
					this.setChild('allp_train', this.allp_trn);
				}).call(_this);
			}
		});




		this.updateState('nav-title', 'Музыкальный кондуктор');
		this.updateState('url-part', '/conductor');
		//world_part
		//countres
		//mp: 'url-part', 'nav-title'
		return this;
	}
});
