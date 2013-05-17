define(['app_serv', 'js/libs/BrowseMap', './LoadableList', 'spv', './SongsList', './ArtCard', 'js/LfmAuth'],
function(app_serv, BrowseMap, LoadableList, spv, SongsList, ArtCard, LfmAuth) {
"use strict";
var localize = app_serv.localize;
//
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

var no_access_compx = {
	depends_on: ['username'],
	fn: function(username) {
		return !username;
	}
};

var connectUsername = function(params) {
	var _this = this;
	if (params.lfm_username){
		this.updateState('username', params.lfm_username);
	} else {
		if (params.for_current_user){
			this.app.on('state-change.lfm_username', function(e) {
				_this.updateState('username', e.value);
			});
		} else {
			throw new Error('only for current user or defined user');
		}
	}
};

//LULA - LfmUserLibraryArtist
//
var LULATracks = function() {};//непосредственно список композиций артиста, которые слушал пользователь
SongsList.extendTo(LULATracks, {
	init: function(opts, params) {
		this._super(opts);
		connectUsername.call(this, params);
		this.artist = params.artist;
		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('username'),
			artist: this.artist
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'library.getTracks',
			field_name: 'tracks.track',
			data: this.getRqData(),
			parser: this.getLastfmTracksList
		});
	},
	'compx-has_no_access': no_access_compx
});


var LULA = function() {};//artist, один артист с треками
BrowseMap.Model.extendTo(LULA, {
	model_name: 'lula',
	init: function(opts, params) {
		this._super(opts);
		var states = {};

		var artist = params.data.artist;
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user,
			artist: artist
		};
		connectUsername.call(this, params);
		spv.cloneObj(states, {
			'url_part': artist,
			'nav_title': artist,
			'artist_name': artist,
			'playcount': params.data.playcount,
			'lfm_image': this.app.art_images.getImageWrap(params.data.lfm_image.array)
		});
		this.updateManyStates(states);

		var all_time = this.getSPI('all_time', true);
		this.updateNesting('all_time', all_time);
	},
	'compx-has_no_access': no_access_compx,
	'compx-selected_image': {
		depends_on: ['lfm_image'],
		fn: function(lfm_i) {
			return lfm_i;
		}
	},
	sub_pa: {
		'all_time': {
			constr: LULATracks,
			title: 'All Time'
		}
	},
	subPager: function() {
		//daterange
	}
});


var UserArtists = function() {};
LoadableList.extendTo(UserArtists, {
	model_name: 'lulas',
	main_list_name: 'artists',
	makeDataItem:function(data) {
		var item = new LULA();
		item.init({
			map_parent: this,
			app: this.app
		}, spv.cloneObj({
			data: data
		}, this.sub_pa_params));
		return item;
	},
	artistListPlaycountParser: function(r, field_name) {
		var result = [];
		var array = spv.toRealArray(spv.getTargetField(r, field_name));
		for (var i = 0; i < array.length; i++) {
			result.push({
				artist: array[i].name,
				lfm_image: {
					array: array[i].image
				},
				playcount: array[i].playcount
			});
		}
		return result;
		//console.log(r);
	},
	'compx-has_no_access': no_access_compx
});

var LULAs = function() {};//artists, список артистов
UserArtists.extendTo(LULAs, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		connectUsername.call(this, params);
	},
	getRqData: function() {
		return {
			user: this.state('username')
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'library.getArtists',
			field_name: 'artists.artist',
			data: this.getRqData(),
			parser: this.artistListPlaycountParser
		});
	}
	
});

var TopLUArt = function() {};
UserArtists.extendTo(TopLUArt, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.timeword = this.init_opts[0].nav_opts.name_spaced;
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		connectUsername.call(this, params);
	},
	getRqData: function() {
		return {
			user: this.state('username'),
			period: this.timeword
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getTopArtists',
			field_name: 'topartists.artist',
			data: this.getRqData(),
			parser: this.artistListPlaycountParser
		});
	}
});


var TopUserTracks = function() {};
SongsList.extendTo(TopUserTracks, {
	init: function(opts, params) {
		this._super(opts);
		connectUsername.call(this, params);
		this.timeword = this.init_opts[0].nav_opts.name_spaced;
		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('username'),
			period: this.timeword
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getTopTracks',
			field_name: 'toptracks.track',
			data: this.getRqData(),
			parser: this.getLastfmTracksList
		});
	},
	'compx-has_no_access': no_access_compx
});


var LfmLovedList = function() {};
SongsList.extendTo(LfmLovedList, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.authInit();
		if (params.lfm_username){
			this.username = params.lfm_username;
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
			user: (this.username || this.app.lfm.username),
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
	init: function(opts, params) {
		this._super(opts);


		this.initStates();
		this.authInit();
		this.authSwitching(this.app.lfm_auth, LfmReccomsLogin);

		if (params.lfm_username){
			this.username = params.lfm_username;
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


var LfmUserArtists = function() {};
BrowseMap.Model.extendTo(LfmUserArtists, {
	model_name: 'lfm_listened_artists',
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		this.username = params.lfm_username;
		this.lists_list = ['library', 'top:7day', 'top:1month',
		'top:3month', 'top:6month', 'top:12month', 'top:overall'];

		this.initSubPages(this.lists_list);

		this.updateNesting('lists_list', this.lists_list);
		this.updateNesting('preview_list', this.lists_list);
		this.bindChildrenPreload();

	},
	sub_pa: {
		'recommended': {
			constr: RecommendatedToUserArtistsList,
			getTitle: function() {
				return this.username ? (localize('reccoms-for') + this.username) : localize('reccoms-for-you');
			}
		},
		'library': {
			constr: LULAs,
			title: 'library'
		},
		'top:7day': {
			constr: TopLUArt,
			title: 'top of 7day'
		},
		'top:1month':{
			constr: TopLUArt,
			title: 'top of month'
		},
		'top:3month':{
			constr: TopLUArt,
			title: 'top of 3 months'
		},
		'top:6month':{
			constr: TopLUArt,
			title: 'top of 6 months'
		},
		'top:12month':{
			constr: TopLUArt,
			title: 'top of 12 months'
		},
		'top:overall':{
			constr: TopLUArt,
			title: ' overall top'
		}
		//артисты в библиотеке
		//недельный чарт
		//
		//лучшие за последние  7 днея, лучше за 3 месяца, полгода, год
		//недельные чарты - отрезки по 7 дней
	}
});

var LfmUserTracks = function() {};
BrowseMap.Model.extendTo(LfmUserTracks, {
	model_name: 'lfm_listened_tracks',
	init: function(opts, params) {
		this._super(opts);
		this.initStates();

		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};

		this.lists_list = ['loved', 'top:7day', 'top:1month',
		'top:3month', 'top:6month', 'top:12month', 'top:overall'];

		this.initSubPages(this.lists_list);

		this.updateNesting('lists_list', this.lists_list);
		this.updateNesting('preview_list', this.lists_list);
		this.bindChildrenPreload();

	},
	sub_pa: {
		'loved': {
			constr: LfmLovedList,
			getTitle: function() {
				return localize('loved-tracks');
			}
		},
		'top:7day': {
			constr: TopUserTracks,
			title: 'top of 7day'
		},
		'top:1month':{
			constr: TopUserTracks,
			title: 'top of month'
		},
		'top:3month':{
			constr: TopUserTracks,
			title: 'top of 3 months'
		},
		'top:6month':{
			constr: TopUserTracks,
			title: 'top of 6 months'
		},
		'top:12month':{
			constr: TopUserTracks,
			title: 'top of 12 months'
		},
		'top:overall':{
			constr: TopUserTracks,
			title: 'overall top'
		}
		//лучшие за последние  7 днея, лучше за 3 месяца, полгода, год
		//недельные чарты - отрезки по 7 дней
	}
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
			user: this.app.lfm.username,
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



var LfmUserAlbums = function() {};
BrowseMap.Model.extendTo(LfmUserAlbums, {
	model_name: 'lfm_listened_albums',
	init: function(opts) {
		this._super(opts);
		this.initStates();
	},
	sub_pa: {
		'recommended': {
			constr: RecommNewReleases,
			getTitle: function() {
				return localize('reccoms-for-you') +': new releases of artists recommended for you';
			}
		},
		'new_releases': {
			constr: UserLibNewReleases,
			getTitle: function() {
				return localize('reccoms-for-you') +': new releases of artists from your library';
			}
		}
	}
});



var TaggedSongs = function() {};
SongsList.extendTo(TaggedSongs, {
	init: function(opts, params) {
		this._super(opts);

		this.tag_name = params.tag_name;
		connectUsername.call(this, params);

		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('username'),
			taggingtype: 'track',
			tag: this.tag_name
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getPersonalTags',
			field_name: 'taggings.tracks.track',
			data: this.getRqData(),
			parser: this.getLastfmTracksList
		});
	},
	'compx-has_no_access': no_access_compx
});

var TaggedArtists = function() {};
ArtCard.ArtistsList.extendTo(TaggedArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		connectUsername.call(this, params);

		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('username'),
			taggingtype: 'artist',
			tag: this.tag_name
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getPersonalTags',
			field_name: 'taggings.artists.artist',
			data: this.getRqData(),
			parser: this.getLastfmArtistsList
		});
	}
});


var TaggedAlbums = function() {};
ArtCard.AlbumsList.extendTo(TaggedAlbums, {
	init: function(opts, params) {
		this._super(opts);
		this.tag_name = params.tag_name;
		connectUsername.call(this, params);
		this.initStates();
	},
	page_limit: 50,
	getRqData: function() {
		return {
			user: this.state('username'),
			taggingtype: 'album',
			tag: this.tag_name
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getPersonalTags',
			field_name: 'taggings.albums.album',
			data: this.getRqData(),
			parser: this.getLastfmAlbumsList
		});
	}
});

var UserTag = function() {};
BrowseMap.Model.extendTo(UserTag, {
	model_name: 'lfm_user_tag',
	init: function(opts, params) {
		this._super(opts);
		var tag_name = params.data.tag_name;
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user,
			tag_name: tag_name
		};
		spv.cloneObj(this.init_states, {
			tag_name: tag_name,
			count: params.data.count,
			nav_title: tag_name,
			url_part: tag_name
		});
		this.initStates();


		this.lists_list = ['artists', 'tracks', 'albums'];
		this.initSubPages(this.lists_list);

		this.updateNesting('lists_list', this.lists_list);
		this.updateNesting('preview_list', this.lists_list);
		this.bindChildrenPreload();
	},
	sub_pa: {
		'tracks': {
			constr: TaggedSongs,
			title: 'Tracks'
		},
		'artists': {
			constr: TaggedArtists,
			title: 'Artists'
		},
		'albums': {
			constr: TaggedAlbums,
			title: "Albums"
		}
	}
});

var LfmUserTags = function() {};
LoadableList.extendTo(LfmUserTags, {
	model_name: 'lfm_listened_tags',
	main_list_name: 'tags',
	init: function(opts, params) {
		this._super(opts);
		connectUsername.call(this, params);
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		this.initStates();
	},
	page_limit: 3000,
	getRqData: function() {
		return {
			user: this.state('username')
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getTopTags',
			field_name: 'toptags.tag',
			data: this.getRqData(),
			parser: this.tagsParser
		});
	},
	
	makeDataItem:function(data) {
		var item = new UserTag();
		item.init({
			map_parent: this,
			app: this.app
		}, spv.cloneObj({
			data: data
		}, this.sub_pa_params));
		return item;
	},
	tagsParser: function(r, field_name) {
		var result = [];
		var array = spv.toRealArray(spv.getTargetField(r, field_name));
		for (var i = 0; i < array.length; i++) {
			result.push({
				tag_name: array[i].name,
				count: array[i].count
			});
		}
		return result;
		//console.log(r);
	},
	'compx-has_no_access': no_access_compx
});

return {
	LfmUserArtists:LfmUserArtists,
	LfmUserTracks:LfmUserTracks,
	LfmUserTags:LfmUserTags,
	LfmUserAlbums:LfmUserAlbums
};
/*
var LfmUserListened = function() {};
BrowseMap.Model.extendTo(LfmUserListened, {
	init: function(opts, params) {
		this._super(opts);
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		
		this.initStates();
		this.lists_list = ['artists', 'tracks', 'tags', 'albums'];
		this.initSubPages(this.lists_list);

		this.updateNesting('lists_list', this.lists_list);
		this.updateNesting('preview_list', this.lists_list);
		this.bindChildrenPreload();
	},
	model_name: 'lfm_listened',
	sub_pa: {
		'artists': {
			constr: LfmUserArtists,
			title: 'Artists'
		},
		'tracks': {
			constr: LfmUserTracks,
			title: 'Tracks'
		},
		'tags': {
			constr: LfmUserTags,
			title: 'Tags'
		},
		'albums': {
			constr: LfmUserAlbums,
			title: 'Albums'
		}
	}
});
return LfmUserListened;*/
});