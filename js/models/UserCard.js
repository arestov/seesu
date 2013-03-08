var UserCardLFMLogin = function() {};
LfmLogin.extendTo(UserCardLFMLogin, {
	beforeRequest: function() {
		this.bindAuthCallback();
		
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			_this.pmd.loadStart();
			_this.pmd.showOnMap();
		}, {exlusive: true});
	}
});

var LfmLovedLogin = function() {};
UserCardLFMLogin.extendTo(LfmLovedLogin, {
	init: function(opts) {
		this._super(opts);
		this.setRequestDesc(localize('grant-love-lfm-access'));
	}
});


var LfmReccomsLogin = function(){};
UserCardLFMLogin.extendTo(LfmReccomsLogin, {
	init: function(opts){
		this._super(opts);
		this.setRequestDesc(localize('lastfm-reccoms-access'));
	}
});

var VkAudioLogin = function() {};
VkLoginB.extendTo(VkAudioLogin, {
	init: function(opts) {
		this._super(opts,  {
			open_opts: {settings_bits: 8},
			desc: localize('to-play-vk-audio')
		});
	},
	beforeRequest: function() {
		var _this = this;
		this.bindAuthReady('input_click', function() {
			_this.pmd.loadStart();
			_this.pmd.showOnMap();
		});
		
	}
});



var LfmLovedList = function() {};
songsList.extendTo(LfmLovedList, {
	init: function(opts, username) {
		this._super(opts);
		this.setBaseInfo({
			title: localize('loved-tracks'),
			type: 'artists by loved'
		});
		this.updateState('url_part', '/loved');
		this.authInit();
		if (username){
			this.username = username;
			this.updateState('has_no_access', false);
		} else {
			this.permanent_md = true;
			this.authSwitching(this.app.lfm_auth, LfmLovedLogin);
		}
	},
	sendMoreDataRequest: function(paging_opts) {
		var _this = this;
		var request_info = {};
		request_info.request = lfm.get('user.getLovedTracks', {
			user: (this.username || lfm.user_name),
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		}, {nocache: true})
			.done(function(r){
				var tracks = toRealArray(getTargetField(r, 'lovedtracks.track'));
				var track_list = [];
				if (tracks) {
					for (var i=paging_opts.remainder, l = Math.min(tracks.length, paging_opts.page_limit); i < l; i++) {
						track_list.push({
							'artist' : tracks[i].artist.name,
							'track': tracks[i].name,
							lfm_image:  {
								array: tracks[i].image
							}
						});
					}
				}
				

				_this.putRequestedData(request_info.request, track_list, r.error);

			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});

		return request_info;
	}
});

var RecommendatedToUserArtistsList = function() {};
ArtistsList.extendTo(RecommendatedToUserArtistsList, {
	page_limit: 30,
	init: function(opts, username) {
		this._super(opts);


		this.updateManyStates({
			'nav_title': username ? (localize('reccoms-for') + username) : localize('reccoms-for-you'),
			'url_part': '/recommended_artists'
		});
		this.authInit();
		this.authSwitching(this.app.lfm_auth, LfmReccomsLogin);
		
		var _this = this;
		if (!username){
			this.permanent_md = true;
		}

		if (username){
			this.username = username;
			if (this.app.env.cross_domain_allowed){
				this.getRqData = this.getRqDataRss;
				this.setLoader(this.loadMoreByRSS);
			}
		} else {
			this.getRqData = this.getRqDataAPI;
			this.setLoader(this.loadMoreByAPI);
		}
	},
	getRqDataAPI: function(paging_opts) {
		return {
			sk: lfm.sk,
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		};
	},
	getRqDataRss: function() {
		return this.username;
	},
	loadMoreByAPI: function(paging_opts) {
		var _this = this;
		var request_info = {};

		request_info.request = lfm.get('user.getRecommendedArtists', this.getRqData(paging_opts), {nocache: true})
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
				_this.putRequestedData(request_info.request, track_list, r.error);

				
			})
			.fail(function(){
				_this.requestComplete(request_info.request, true);
			}).always(function() {
				request_info.done = true;
			});
		return request_info;
	},
	loadMoreByRSS: function() {
		var _this = this;
		var request_info = {};
		request_info.request = $.ajax({
			url: 'http://ws.audioscrobbler.com/1.0/user/' + this.getRqData() + '/systemrecs.rss',
			type: "GET",
			dataType: "xml"
		})
			.done(function(xml) {
				var artists = $(xml).find('channel item title');
				if (artists && artists.length) {
					var track_list_without_tracks = [];
					for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
						var artist = $(artists[i]).text();
						track_list_without_tracks.push({
							artist: artist
						});
					}
					_this.putRequestedData(request_info.request, track_list_without_tracks);
					_this.setLoaderFinish();
				}
			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});
		return request_info;
	}
});


var MyVkAudioList = function() {};
songsList.extendTo(MyVkAudioList, {
	init: function(opts, user_id) {
		this._super(opts);

		this.user_id = user_id;

		if (!user_id){
			this.permanent_md = true;
		}
		this.setBaseInfo({
			title: localize('vk-audio'),
			type: 'vk-audio'
		});

		this.updateState('url_part', '/vk-audio');
		this.authInit();
		this.authSwitching(this.app.vk_auth, VkAudioLogin);
	},
	sendMoreDataRequest: function(paging_opts) {
		
		var request_info = {};
		var _this = this;

		request_info.request = this.app.vk_api.get('audio.get', {
			sk: lfm.sk,
			count: paging_opts.page_limit,
			offset: (paging_opts.next_page - 1) * paging_opts.page_limit
		}, {nocache: true})
			.done(function(r){
				if (!r || r.error){
					_this.requestComplete(request_info.request, true);
					return;
				}
				var vk_search = _this.app.mp3_search.getSearchByName('vk');
			
				var track_list = [];

				for (var i = 0; i < r.response.length; i++) {
					var cur = r.response[i];
					track_list.push({
						artist: HTMLDecode(cur.artist),
						track: HTMLDecode(cur.title),
						file: vk_search.makeSongFile(cur)
					});
				}

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

var artistsRecommsList = function() {};
songsList.extendTo(artistsRecommsList, {
	init: function(opts, username) {
		this._super(opts);

		this.setBaseInfo({
			title: username ? (localize('reccoms-for') + username) : localize('reccoms-for-you'),
			type: 'artists by recommendations'
		});
		this.updateState('url_part', '/recommendations');
		this.authInit();
		this.authSwitching(this.app.lfm_auth, LfmReccomsLogin);
		
		var _this = this;
		if (!username){
			this.permanent_md = true;
		}

		if (username){
			if (this.app.env.cross_domain_allowed){
				_this.setLoader(this.loadMoreByRSS);
			}
		} else {
			_this.setLoader(this.loadMoreByAPI);
			
		}
	},
	loadMoreByAPI: function(paging_opts) {
		var _this = this;
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
				_this.putRequestedData(request_info.request, track_list, r.error);

				
			})
			.fail(function(){
				_this.requestComplete(request_info.request, true);
			}).always(function() {
				request_info.done = true;
			});
		return request_info;
	},
	loadMoreByRSS: function() {
		var _this = this;
		var request_info = {};
		request_info.request = $.ajax({
			url: 'http://ws.audioscrobbler.com/1.0/user/' + username + '/systemrecs.rss',
			type: "GET",
			dataType: "xml"
		})
			.done(function(xml) {
				var artists = $(xml).find('channel item title');
				if (artists && artists.length) {
					var track_list_without_tracks = [];
					for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
						var artist = $(artists[i]).text();
						track_list_without_tracks.push({
							artist: artist
						});
					}
					_this.putRequestedData(request_info.request, track_list_without_tracks);
					_this.setLoaderFinish();
				}
			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});
		return request_info;
	}
	
});


var UsersList = function() {};
mapLevelModel.extendTo(UsersList, {
	
});

var UserNewReleases = function() {};
AlbumsList.extendTo(UserNewReleases, {
	init: function(opts, params) {
		this._super(opts);
		this.authInit();
		this.authSwitching(this.app.lfm_auth, LfmReccomsLogin);

		/*
		this._super(opts);
		this.artist = params.artist;
		this.updateManyStates({
			'nav_title': 'Albums of ' + this.artist + ' from last.fm',
			'url_part': '/albums_lfm'
		});*/
	},
	page_limit: 50,
	getRqData: function(paging_opts) {
		return {
			user: lfm.user_name,
			limit: paging_opts.page_limit,
			userecs: this.recomms ? 1 : 0
		};
	},
	sendMoreDataRequest: function(paging_opts) {
		var username = this.username;
		var _this = this;
		var request_info = {};
		request_info.request = this.app.lfm.get('user.getNewReleases', this.getRqData(paging_opts))
			.done(function(r){
				
				var albums_data = toRealArray(getTargetField(r, 'albums.album'));


				var data_list = [];
				if (albums_data.length) {
					var l = Math.min(albums_data.length, paging_opts.page_limit);
					for (var i=paging_opts.remainder; i < l; i++) {
						var cur = albums_data[i];
						data_list.push({
							album_artist: getTargetField(cur, 'artist.name'),
							album_name: cur.name,
							lfm_image: {
								array: cur.image
							},
							playcount: cur.playcount
						});
					}
					
				}
				_this.setLoaderFinish();
				_this.putRequestedData(request_info.request, data_list, r.error);
				
			})
			.fail(function() {
				_this.requestComplete(request_info.request, true);
			})
			.always(function() {
				request_info.done = true;
			});
		return request_info;
	}
});

var UserLibNewReleases= function() {};
UserNewReleases.extendTo(UserLibNewReleases, {
	init: function(opts, params) {
		this._super(opts, params);
		this.updateManyStates({
			'nav_title': localize('reccoms-for-you') +': new releases of artists from your library',
			'url_part': '/lib_releases'
		});
	}
});

var RecommNewReleases = function() {};
UserNewReleases.extendTo(RecommNewReleases, {
	init: function(opts, params) {
		this._super(opts, params);
		this.updateManyStates({
			'nav_title': localize('reccoms-for-you') +': new releases of artists recommended for you',
			'url_part': '/recommended_releases'
		});
	},
	recomms: true
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


			this.arts_recomms = new RecommendatedToUserArtistsList();
			this.arts_recomms.init({
				app: this.app,
				map_parent: this
			});
			this.setChild('arts_recomms', this.arts_recomms, true);


			this.lfm_loved = new LfmLovedList();
			this.lfm_loved.init({
				app: this.app,
				map_parent: this
			});
			this.setChild('lfm_loved', this.lfm_loved, true);

			this.my_vkaudio = new MyVkAudioList();
			this.my_vkaudio.init({
				app: this.app,
				map_parent: this
			});
			this.setChild('vk_audio', this.my_vkaudio, true);

			this.new_releases = new UserLibNewReleases();
			this.new_releases.init({
				app: this.app,
				map_parent: this
			});
			this.setChild('new_releases', this.new_releases, true);

			this.recomm_releases = new RecommNewReleases();
			this.recomm_releases.init({
				app: this.app,
				map_parent: this
			});
			this.setChild('recomm_releases', this.recomm_releases, true);

			
		};
		jsLoadComplete({
			test: function() {
				return _this.app.p && _this.app.mp3_search;
			},
			fn: function() {
				postInit.call(_this);
			}
		});
		jsLoadComplete({
			test: function() {
				return _this.app && _this.app.gena;
			},
			fn: function() {
				(function(){
					

					var hasPlaylistCheck = function(items) {
						_this.updateState('has_playlists', !!items.length);
					};
					hasPlaylistCheck(this.app.gena.playlists);
					
					this.app.gena.on('playlsits-change', hasPlaylistCheck);


				}).call(_this);
			}
		});
		jsLoadComplete(function() {
			setTimeout(function() {
				var gena = new SuUsersPlaylists();
				gena.init({
					app:_this.app,
					map_parent: _this
				});
				_this.app.gena = gena;

				var plsts_str = suStore('user_playlists');
				if (plsts_str){
					gena.setSavedPlaylists(plsts_str);
				}
				_this.setChild('user-playlists', gena, true);

				jsLoadComplete.change();
			}, 150);
			
		});

		var users_acqutes = new UserAcquaintancesLists();
		users_acqutes.init({
			app: this.app,
			map_parent: this
		});

		this.setChild('users_acqutes', users_acqutes);
		

		this.updateState('url_part', '/users/' + (this.for_current_user ? 'me' : params.username));

		this.updateState('nav_title', 'Персональная музыка, друзья и знакомства');
		/*

		аудиозаписи

		рекомендации артистов, альбомов, любимые

		последнее
		библиотека

		//http://ws.audioscrobbler.com/2.0/?method=user.getnewreleases&user=yodapunk&api_key=2803b2bcbc53f132b4d4117ec1509d65&format=json
		//http://ws.audioscrobbler.com/2.0/?method=user.getnewreleases&user=yodapunk&api_key=2803b2bcbc53f132b4d4117ec1509d65&format=json&userecs=1

		*/

		return this;
	},
	'stch-mp_show': function(state) {
		if (state && state.userwant){
			var list_to_preload = [
				this.getChild('arts_recomms'),
				this.getChild('lfm_loved'),
				this.getChild('vk_audio'),
				this.getChild('new_releases'),
				this.getChild('recomm_releases')
				

			];
			for (var i = 0; i < list_to_preload.length; i++) {
				var cur = list_to_preload[i];
				if (cur){
					cur.preloadStart();
				}
			}

			
		}
	}
});




var SongListener = function() {};
provoda.Model.extendTo(SongListener, {
	init: function(opts, params) {
		this.app = opts.app;
		this.userdata = params.data;
		//this.updateState('picture', this.userdata.big_pic.url);
	},
	showFullPreview: function() {

	}
});