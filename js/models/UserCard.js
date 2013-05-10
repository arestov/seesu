define(['provoda', 'spv', 'app_serv', './comd', 'jquery',
'js/libs/BrowseMap', './SongsList', 'js/LfmAuth', './ArtCard' , 'js/common-libs/htmlencoding', './UserAcquaintancesLists', './SuUsersPlaylists', './LfmUserListened'],
function(provoda, spv, app_serv, comd, $,
BrowseMap, SongsList, LfmAuth, ArtCard, htmlencoding, UserAcquaintancesLists, SuUsersPlaylists, LfmUserListened ){
"use strict";
var localize = app_serv.localize;

var UserCardLFMLogin = function() {};
LfmAuth.LfmLogin.extendTo(UserCardLFMLogin, {
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
comd.VkLoginB.extendTo(VkAudioLogin, {
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
SongsList.extendTo(LfmLovedList, {
	init: function(opts, username) {
		this._super(opts);
		this.initStates();
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
		request_info.request = this.app.lfm.get('user.getLovedTracks', {
			user: (this.username || this.app.lfm.user_name),
			limit: paging_opts.page_limit,
			page: paging_opts.next_page
		}, {nocache: true})
			.done(function(r){
				var tracks = spv.toRealArray(spv.getTargetField(r, 'lovedtracks.track'));
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
ArtCard.ArtistsList.extendTo(RecommendatedToUserArtistsList, {
	page_limit: 30,
	init: function(opts, username) {
		this._super(opts);


		this.initStates();
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
			sk: this.app.lfm.sk,
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

		request_info.request = this.app.lfm.get('user.getRecommendedArtists', this.getRqData(paging_opts), {nocache: true})
			.done(function(r){
				var artists = spv.toRealArray(spv.getTargetField(r, 'recommendations.artist'));
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
SongsList.extendTo(MyVkAudioList, {
	init: function(opts, user_id) {
		this._super(opts);

		this.user_id = user_id;

		if (!user_id){
			this.permanent_md = true;
		}
		this.initStates();
		this.authInit();
		this.authSwitching(this.app.vk_auth, VkAudioLogin);
	},
	sendMoreDataRequest: function(paging_opts) {
		
		var request_info = {};
		var _this = this;

		request_info.request = this.app.vk_api.get('audio.get', {
			sk: this.app.lfm.sk,
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
						artist: htmlencoding.decode(cur.artist),
						track: htmlencoding.decode(cur.title),
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



var UsersList = function() {};
BrowseMap.Model.extendTo(UsersList, {
	
});

var UserNewReleases = function() {};
ArtCard.AlbumsList.extendTo(UserNewReleases, {
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
			user: this.app.lfm.user_name,
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
				
				var albums_data = spv.toRealArray(spv.getTargetField(r, 'albums.album'));


				var data_list = [];
				if (albums_data.length) {
					var l = Math.min(albums_data.length, paging_opts.page_limit);
					for (var i=paging_opts.remainder; i < l; i++) {
						var cur = albums_data[i];
						data_list.push({
							album_artist: spv.getTargetField(cur, 'artist.name'),
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
		this.initStates();
	}
});

var RecommNewReleases = function() {};
UserNewReleases.extendTo(RecommNewReleases, {
	init: function(opts, params) {
		this._super(opts, params);
		this.initStates();
	},
	recomms: true
});



var UserCard = function() {};

BrowseMap.Model.extendTo(UserCard, {
	model_name: 'usercard',
	sub_pa: {
		'recommended_artists': {
			constr: RecommendatedToUserArtistsList,

			getTitle: function() {
				return this.username ? (localize('reccoms-for') + this.username) : localize('reccoms-for-you');
			}
		},
		'recommended_releases': {
			constr: RecommNewReleases,
			getTitle: function() {
				return localize('reccoms-for-you') +': new releases of artists recommended for you';
			}
		},
		'lib_releases': {
			constr: UserLibNewReleases,
			getTitle: function() {
				return localize('reccoms-for-you') +': new releases of artists from your library';
			}
		},
		'listened': {
			constr: LfmUserListened,
			title: 'Listened music'
		},
		'vk-audio': {
			constr: MyVkAudioList,
			getTitle: function() {
				return localize('vk-audio');
			}
		},
		'loved': {
			constr: LfmLovedList,
			getTitle: function() {
				return localize('loved-tracks');
			}
		}
		
	},
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.app = opts.app;

		//this.
		//new
		this.urp_name = params.urp_name;
		this.for_current_user = this.urp_name == 'me' || params.for_current_user;
		if (this.for_current_user){
			this.permanent_md = true;
		}

		var _this = this;

		this.arts_recomms = this.getSPI('recommended_artists', true);
		this.updateNesting('arts_recomms', this.arts_recomms);

		this.lfm_listened = this.getSPI('listened', true);
		this.updateNesting('lfm_listened', this.lfm_listened);

		this.lfm_loved = this.getSPI('loved', true);
		this.updateNesting('lfm_loved', this.lfm_loved);

		
		this.my_vkaudio = this.getSPI('vk-audio', true);
		this.updateNesting('vk_audio', this.my_vkaudio);

		this.new_releases = this.getSPI('lib_releases', true);
		this.updateNesting('new_releases', this.new_releases);

		this.recomm_releases = this.getSPI('recommended_releases', true);
		this.updateNesting('recomm_releases', this.recomm_releases);

		var gena = new SuUsersPlaylists();
		gena.init({
			app:_this.app,
			map_parent: _this
		});
		_this.app.gena = gena;

		var plsts_str = app_serv.store('user_playlists');
		if (plsts_str){
			gena.setSavedPlaylists(plsts_str);
		}
		_this.updateNesting('user-playlists', gena);

		(function(){
			

			var hasPlaylistCheck = function(items) {
				_this.updateState('has_playlists', !!items.length);
			};
			hasPlaylistCheck(this.app.gena.playlists);
			
			this.app.gena.on('playlsits-change', hasPlaylistCheck);


		}).call(_this);

		var users_acqutes = new UserAcquaintancesLists();
		users_acqutes.init({
			app: this.app,
			map_parent: this
		});

		this.updateNesting('users_acqutes', users_acqutes);
		
		
		this.init_states['nav_title'] = this.for_current_user ? localize('your-pmus-f-aq') : '';
		this.initStates();
		
		if (this.for_current_user){
			this.map_parent.on('state-change.can_expand', function(e) {
				_this.updateState('can_expand', e.value);
			});
		}
		/*

		аудиозаписи

		рекомендации артистов, альбомов, любимые

		последнее
		библиотека

		//http://ws.audioscrobbler.com/2.0/?method=user.getnewreleases&user=yodapunk&api_key=&format=json
		//http://ws.audioscrobbler.com/2.0/?method=user.getnewreleases&user=yodapunk&api_key=&format=json&userecs=1

		*/

		return this;
	},
	'stch-mp_show': function(state) {
		if (state && state.userwant){
			var list_to_preload = [
				this.getNesting('arts_recomms'),
				this.getNesting('lfm_loved'),
				this.getNesting('vk_audio'),
				this.getNesting('new_releases'),
				this.getNesting('recomm_releases')
				

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

return UserCard;
});