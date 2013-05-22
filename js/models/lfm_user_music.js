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
		this.bindChildrenPreload([all_time]);
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
			this.authSwitching(this.app.lfm_auth, LfmLovedLogin);
		}
	},
	getRqData: function() {
		return {
			user: (this.username || this.app.lfm.username)
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getLovedTracks',
			field_name: 'lovedtracks.track',
			data: this.getRqData(),
			parser: this.getLastfmTracksList
		});
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
	getRqDataAPI: function() {
		return {
			sk: this.app.lfm.sk
		};
	},
	getRqDataRss: function() {
		return this.username;
	},
	loadMoreByAPI: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getRecommendedArtists',
			field_name: 'recommendations.artist',
			data: this.getRqData(),
			parser: this.getLastfmArtistsList
		});
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
		this.initListedModels(['recommended', 'library', 'top:7day', 'top:1month',
		'top:3month', 'top:6month', 'top:12month', 'top:overall']);
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
var LfmRecentUserTracks = function() {};
SongsList.extendTo(LfmRecentUserTracks, {
	init: function(opts, params) {
		this._super(opts);

		connectUsername.call(this, params);

		this.initStates();
	},
	getRqData: function() {
		if (!this.slice_time_end){
			this.slice_time_end = (new Date()/1000).toFixed();
		}
		return {
			user: this.state('username'),
			extended: 1,
			to: this.slice_time_end,
			nowplaying: true
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getRecentTracks',
			field_name: 'recenttracks.track',
			data: this.getRqData(),
			parser: this.getLastfmTracksList
		});
	},
	'compx-has_no_access': no_access_compx
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

		this.initListedModels(['loved', 'recent', 'top:7day', 'top:1month',
		'top:3month', 'top:6month', 'top:12month', 'top:overall']);

	},
	sub_pa: {
		'loved': {
			constr: LfmLovedList,
			getTitle: function() {
				return localize('loved-tracks');
			}
		},
		'recent':{
			constr: LfmRecentUserTracks,
			title: "Recently listened"
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
	getRqData: function() {
		return {
			user: this.app.lfm.username,
			userecs: this.recomms ? 1 : 0
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getNewReleases',
			field_name: 'albums.album',
			data: this.getRqData(),
			parser: this.getLastfmAlbumsList
		});
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


var LfmUserTopAlbums = function() {};
ArtCard.AlbumsList.extendTo(LfmUserTopAlbums, {
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
			method: 'user.getTopAlbums',
			field_name: 'topalbums.album',
			data: this.getRqData(),
			parser: this.getLastfmAlbumsList
		});
	},
	'compx-has_no_access': no_access_compx
});

var LfmUserAlbums = function() {};
BrowseMap.Model.extendTo(LfmUserAlbums, {
	model_name: 'lfm_listened_albums',
	init: function(opts, params) {
		this._super(opts);
		this.initStates();

		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		this.username = params.lfm_username;
		this.fcuser = params.for_current_user;

		this.initListedModels(['recommended', 'new_releases', 'top:7day', 'top:1month',
		'top:3month', 'top:6month', 'top:12month', 'top:overall']);
	},
	sub_pa: {
		'recommended': {
			constr: RecommNewReleases,
			getTitle: function() {
				var base = 'new releases of artists recommended for ';
				return base + (this.fcuser ? 'you' : this.username);
			}
		},
		'new_releases': {
			constr: UserLibNewReleases,
			getTitle: function() {
				var base = 'new releases of artists from %user% library';
				return base.replace('%user%', this.fcuser ? 'your' : this.username);
			}
		},
		'top:7day':{
			constr: LfmUserTopAlbums,
			title: 'Top of 7 days'
		},
		'top:1month':{
			constr: LfmUserTopAlbums,
			title: 'Top of 1 month'
		},
		'top:3month':{
			constr: LfmUserTopAlbums,
			title: 'Top of 3 months'
		},
		'top:6month':{
			constr: LfmUserTopAlbums,
			title: 'Top of 6 months'
		},
		'top:12month':{
			constr: LfmUserTopAlbums,
			title: 'Top of 12 months'
		},
		'top:overall':{
			constr: LfmUserTopAlbums,
			title: 'Overall top'
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

		this.initListedModels(['artists', 'tracks', 'albums']);
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

var LfmUserPreview = function() {};
BrowseMap.Model.extendTo(LfmUserPreview, {
	init: function(opts, params) {
		this._super(opts);
		var data = params.data;

		var song, song_time;
		var artist = spv.getTargetField(data, 'recenttrack.artist.name');
		if (artist){
			song = artist + ' - ' + spv.getTargetField(data, 'recenttrack.name');
			song_time = spv.getTargetField(data, 'recenttrack.@attr.uts');
			if (song_time){
				song_time = new Date(song_time * 1000);
			}
		}
		var image = this.app.art_images.getImageRewrap(data.lfm_image);

		spv.cloneObj(this.init_states, {
			selected_image: image,
			nav_title: data.username,
			username: data.username,
			registered: data.registered,

			gender: data.gender,
			lfm_image: image,
			big_desc: data.big_desc,
			song: song,
			song_time: song_time && song_time.toLocaleString(),
			song_time_raw: song_time,
			scrobbler: data.scrobblesource
		});
		this.initStates();
		this.rawdata = data;
	},
	showOnMap: function() {
		var md = this.app.getLastfmUser(this.state('username'));
		md.setProfileData(this.rawdata);
		md.showOnMap();
		//this.app.showLastfmUser(this.state('username'));
		//this.app.
	}
});

var LfmFriendsList = function() {};
LfmFriendsList.parseUserInfo = function(cur) {
	var registered = spv.getTargetField(cur, 'registered.unixtime');
	if (registered){
		registered = registered * 1000;
	}
	var data = {
		username: cur.name,
		realname: cur.realname,
		country: cur.country,
		age: cur.age,
		gender: cur.gender,
		playcount: cur.playcount,
		playlists: cur.playlists,
		lfm_image: {
			array: cur.image
		},
		registered: registered,
		scrobblesource: cur.scrobblesource,
		recenttrack: cur.recenttrack,
		
		big_desc: null
	};

	var big_desc = [];
	var bide_items = [data.realname, data.age, data.gender, data.country];
	for (var i = 0; i < bide_items.length; i++) {
		if (bide_items[i]){
			big_desc.push(bide_items[i]);
		}
	}
	data.big_desc =  big_desc.join(', ');

	return data;
};

var LfmUsersList = function() {};
LoadableList.extendTo(LfmUsersList, {
	friendsParser: function(r, field_name) {
		var result = [];
		var array = spv.toRealArray(spv.getTargetField(r, field_name));
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			result.push(LfmFriendsList.parseUserInfo(cur));
			/*
			result.push({
				tag_name: array[i].name,
				count: array[i].count
			});*/
		}
		return result;
		//console.log(r);
	},
	init: function(opts, params) {
		this._super(opts);
		connectUsername.call(this, params);
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		this.initStates();
	},
	makeDataItem:function(data) {
		var item = new this.itemConstr();
		item.init({
			map_parent: this,
			app: this.app
		}, spv.cloneObj({
			data: data
		}, this.sub_pa_params));
		return item;
	},
	main_list_name: 'list_items',
	model_name: 'lfm_users',
	page_limit: 200,
	'compx-has_no_access': no_access_compx
});


LfmUsersList.extendTo(LfmFriendsList, {
	beforeReportChange: function(list) {
		list.sort(function(a,b ){return spv.sortByRules(a, b, [
			{
				field: function(item) {
					switch (item.states.gender) {
						case 'f'://female
							return 1;
						case 'm'://male
							return 2;
						default:
							return 3;
					}
				}
			},
			{
				field: 'states.song_time_raw',
				reverse: true
			}
		]);});
	},
	
	getRqData: function() {
		return {
			recenttracks: true,
			user: this.state('username')
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getFriends',
			field_name: 'friends.user',
			data: this.getRqData(),
			parser: this.friendsParser
		});
	},
	itemConstr: LfmUserPreview
});
var LfmNeighboursList = function() {};
LfmUsersList.extendTo(LfmNeighboursList, {
	itemConstr: LfmUserPreview,
	getRqData: function() {
		return {
			user: this.state('username')
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getNeighbours',
			field_name: 'neighbours.user',
			data: this.getRqData(),
			parser: this.friendsParser
		});
	}
});

return {
	LfmUserArtists:LfmUserArtists,
	LfmUserTracks:LfmUserTracks,
	LfmUserTags:LfmUserTags,
	LfmUserAlbums:LfmUserAlbums,
	LfmFriendsList: LfmFriendsList,
	LfmNeighboursList: LfmNeighboursList
};

});