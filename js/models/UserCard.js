

var LfmReccomsLogin = function(){};
LfmLogin.extendTo(LfmReccomsLogin, {
	init: function(opts){
		this._super(opts);
		this.setRequestDesc(localize('lastfm-reccoms-access'));
	},
	beforeRequest: function() {
		this.bindAuthCallback();
		
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			_this.pmd.loadPlStart();
			_this.pmd.showPlPage();
		}, {exlusive: true});
	}
});


var EnhancedSongslist = function() {};
songsList.extendTo(EnhancedSongslist, {
	
	showPlPage: function() {
		this.app.show_playlist_page(this, {
			page_md: this.pmd,
			source_md: this
		});
	},
	switchPmd: function(toggle) {
		var new_state;
		if (typeof toggle == 'boolean')	{
			new_state = toggle;
		} else {
			new_state = !this.state('pmd-vswitched');
		}
		if (new_state){
			if (!this.state('pmd-vswitched')){
				this.pmd.updateState('vswitched', this.provoda_id);
			}
		} else {
			if (this.state('pmd-vswitched')){
				this.pmd.updateState('vswitched', false);
			}
		}
		
		
	},
	checkPMDSwiched: function(value) {
		this.updateState('pmd-vswitched', value == this.provoda_id);
	},
	requestPlaylist: function() {
		if (this.state('has-access')){
			this.loadPlStart();
			this.showPlPage();
		} else {
			this.switchPmd();
		}
	}
});

var MyVkAudioList = function() {};
EnhancedSongslist.extendTo(MyVkAudioList, {
	init: function(opts, user_id) {
		this._super(opts);

		this.user_id = user_id;

		if (!user_id){
			this.permanent_md = true;
		}
		this.setBaseInfo({
			title: 'vk audio',
			type: 'vk-audio'
		});

		this.updateState('url-part', '/vk-audio');

		this.updateState('has-access', true);




		this.setLoader(function(paging_opts) {
			
			var request_info = {};
			var _this = this;

			request_info.request = this.app.vk_api.get('audio.get', {
				sk: lfm.sk,
				count: paging_opts.page_limit,
				offset: (paging_opts.next_page - 1) * paging_opts.page_limit
			}, {nocache: true})
				.done(function(r){
					var vk_search = _this.app.mp3_search.getSearchByName('vk');
				
					var track_list = [];

					for (var i = 0; i < r.response.length; i++) {
						var cur = r.response[i];
						track_list.push({
							artist: cur.artist,
							track: cur.title,
							file: vk_search.makeSongFile(cur)
						});
						
					}

					_this.injectExpectedSongs(track_list);

					if (track_list.length < paging_opts.page_limit){
						_this.setLoaderFinish();
					}
				})
				.fail(function(){
					_this.loadComplete(true);
				}).always(function() {
					request_info.done = true;
				});
			return request_info;
		});
	}
});

var artistsRecommsList = function() {};
EnhancedSongslist.extendTo(artistsRecommsList, {
	
	authSwitching: function(auth_rqb) {
		
		auth_rqb.init({auth: this.app.lfm_auth, pmd: this});


		this.updateState('has-access', auth_rqb.state('has-session'));


		auth_rqb.on('state-change.has-session', function() {
			_this.updateState('has-access', true);
			_this.switchPmd(false);
		});

		this.setChild('auth_part', auth_rqb);

		

		var _this = this;

		this.pmd.on('state-change.vswitched', function(e) {
			_this.checkPMDSwiched(e.value);
		});

	},
	init: function(opts, username) {
		this._super(opts);
		var title  = 'Recommendations for ' +  (username || 'you');

		this.setBaseInfo({
			title: title,
			type: 'artists by recommendations'
		});
		var lfm_recml = new LfmReccomsLogin();
		
		this.authSwitching(lfm_recml);
		if (this.state('has-access')){
			//this.loadPlStart();
		}
		this.updateState('url-part', '/recommendations');
		var _this = this;
		if (!username){
			this.permanent_md = true;
		}

		if (username){
			if (this.app.env.cross_domain_allowed){
				_this.setLoader(function() {
					var request_info = {};
					request_info.request = $.ajax({
						url: 'http://ws.audioscrobbler.com/1.0/user/' + username + '/systemrecs.rss',
						type: "GET",
						dataType: "xml"
					})
						.done(function(xml) {
							var artists = $(xml).find('channel item title');
							if (artists && artists.length) {
								var artist_list = [];
								for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
									var artist = $(artists[i]).text();
									artist_list.push(artist);
								}
								var track_list_without_tracks = [];
								if (artist_list){
									for (var i=0; i < artist_list.length; i++) {
										track_list_without_tracks.push({"artist" :artist_list[i]});
									}
								}
								pl_r.injectExpectedSongs(track_list_without_tracks);
								_this.setLoaderFinish();
							}
						})
						.fail(function() {
							_this.loadComplete(true);
						})
						.always(function() {
							request_info.done = true;
						});
					return request_info;

				});
			}
		} else {
			_this.setLoader(function(paging_opts) {
			
				var request_info = {};

				request_info.request = lfm.get('user.getRecommendedArtists', {
					sk: lfm.sk,
					limit: paging_opts.page_limit,
					page: paging_opts.next_page
				}, {nocache: true})
					.done(function(r){
						var artists = toRealArray(getTargetField(r, 'recommendations.artist'));
						var track_list = [];
						if (artists && artists.length) {
							
							for (var i=0, l = Math.min(artists.length, paging_opts.page_limit); i < l; i++) {
								track_list.push({
									artist: artists[i].name,
									lfm_image: {
										array: artists[i].image
									}
								});
							}
						}
						_this.injectExpectedSongs(track_list);

						if (track_list.length < paging_opts.page_limit){
							_this.setLoaderFinish();
						}
					})
					.fail(function(){
						_this.loadComplete(true);
					}).always(function() {
						request_info.done = true;
					});
				return request_info;
			});
			
		}
		

	}
});


var UsersList = function() {};
mapLevelModel.extendTo(UsersList, {
	
});


var UserCard = function() {};

mapLevelModel.extendTo(UserCard, {
	model_name: 'usercard',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.app = opts.app;

		//this.
		//new
		this.for_current_user = params.for_current_user;
		if (this.for_current_user){
			this.permanent_md = true;
		}

		var _this = this;

		var postInit = function() {

			this.arts_recomms = new artistsRecommsList();
			this.arts_recomms.init({pmd: this, app: this.app});
			this.setChild('arts_recomms', this.arts_recomms);

			this.my_vkaudio = new MyVkAudioList();
			this.my_vkaudio.init({pmd: this, app: this.app});
			this.setChild('vk_audio', this.my_vkaudio);
		};
		jsLoadComplete({
			test: function() {
				return _this.app.p && _this.app.mp3_search;
			},
			fn: function() {
				postInit.call(_this);
			}
		});
		this.updateState('url-part', '/users/' + (this.for_current_user ? 'me' : params.username));

		this.updateState('nav-title', 'Персональная музыка, друзья и знакомства');
		/*

		аудиозаписи

		рекомендации артистов, альбомов, любимые

		последнее
		библиотека */

		return this;
	},
	'stch-mp-show': function(state) {
		if (state && state.userwant){
			var arts_recomms = this.getChild('arts_recomms');
			if (arts_recomms){
				arts_recomms.preloadStart();
			}
		}
	}
});