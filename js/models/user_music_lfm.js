define(['app_serv', 'js/libs/BrowseMap', './LoadableList', 'spv', './SongsList', './ArtCard', 'js/LfmAuth', 'js/modules/declr_parsers'],
function(app_serv, BrowseMap, LoadableList, spv, SongsList, ArtCard, LfmAuth, declr_parsers) {
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

var no_access_compx = {
	depends_on: ['userid'],
	fn: function(userid) {
		return !userid;
	}
};

var connectUserid = function(params) {
	if (params.lfm_userid){
		this.updateState('userid', params.lfm_userid);
	} else {
		if (params.for_current_user){
			this.updateState('userid', false);
			this.wch(this.app, 'lfm_userid', 'userid');

			if (this.authInit){
				this.authInit();
			}
			if (this.authSwitching){
				this.authSwitching(this.app.lfm_auth, UserCardLFMLogin, {desc: this.access_desc});
			}
			
		} else {
			throw new Error('only for current user or defined user');
		}
	}

	/*
	*/
};

//LULA - LfmUserLibraryArtist
//
var LULATracks = function() {};//непосредственно список композиций артиста, которые слушал пользователь
SongsList.extendTo(LULATracks, {
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		connectUserid.call(this, params);
		this.artist = params.artist;
		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('userid'),
			artist: this.artist
		};
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['lfm', 'get', function() {
			return ['library.getTracks', this.getRqData()];
		}]
	]
});


var LULA = function() {};//artist, один артист с треками
BrowseMap.Model.extendTo(LULA, {
	model_name: 'lula',
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		var states = {};

		var artist = params.data.artist;
		this.sub_pa_params = {
			lfm_userid: params.lfm_userid,
			for_current_user: params.for_current_user,
			artist: artist
		};
		connectUserid.call(this, params);
		spv.cloneObj(states, {
			'url_part': artist,
			'nav_title': artist,
			'artist_name': artist,
			'playcount': params.data.playcount,
			'lfm_image': params.data.lfm_img
		});
		this.updateManyStates(states);
	},
	'nest-all_time': ['all_time', true],
	
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
	makeDataItem: function(data) {
		return this.initSi(LULA, spv.cloneObj({
			data: data
		}, this.sub_pa_params));
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
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.initStates();
		this.sub_pa_params = {
			lfm_userid: params.lfm_userid,
			for_current_user: params.for_current_user
		};
		connectUserid.call(this, params);
	},
	getRqData: function() {
		return {
			user: this.state('userid')
		};
	},
	'nest_req-artists': [
		declr_parsers.lfm.getArtists('artists'),
		['lfm', 'get', function() {
			return ['library.getArtists', this.getRqData()];
		}]
	]
	
});

var TopLUArt = function() {};
UserArtists.extendTo(TopLUArt, {
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.initStates();
		this.timeword = params.timeword;
		this.sub_pa_params = {
			lfm_userid: params.lfm_userid,
			for_current_user: params.for_current_user
		};
		connectUserid.call(this, params);
	},
	getRqData: function() {
		return {
			user: this.state('userid'),
			period: this.timeword
		};
	},
	'nest_req-artists': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['user.getTopArtists', this.getRqData()];
		}]
	],
	hp_bound: {
		timeword: null,
		for_current_user: null,
		lfm_userid: null
	},
	data_by_urlname: {
		timeword: 'name_spaced'
	}
});


var TopUserTracks = function() {};
SongsList.extendTo(TopUserTracks, {
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		connectUserid.call(this, params);
		this.timeword = params.timeword;
		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('userid'),
			period: this.timeword
		};
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['user.getTopTracks', this.getRqData()];
		}]
	],
	hp_bound: {
		timeword: null,
		for_current_user: null,
		lfm_userid: null
	},
	data_by_urlname: {
		timeword: 'name_spaced'
	}
});


var LfmLovedList = function() {};
SongsList.extendTo(LfmLovedList, {
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.initStates();
		connectUserid.call(this, params);
		
	},
	access_desc: localize('grant-love-lfm-access'),
	getRqData: function() {
		return {
			user: this.state('userid')
		};
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('lovedtracks'),
		['lfm', 'get', function() {
			return ['user.getLovedTracks', this.getRqData()];
		}]
	]
});

var RecommendatedToUserArtistsList = function() {};
ArtCard.ArtistsList.extendTo(RecommendatedToUserArtistsList, {
	page_limit: 30,
	access_desc: localize('lastfm-reccoms-access'),
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);


		this.initStates();
		connectUserid.call(this, params);

		if (params.lfm_userid){
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
		return this.state('userid');
	},
	loadMoreByAPI: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getRecommendedArtists',
			field_name: 'recommendations.artist',
			data: this.getRqData(),
			parser: this.getLastfmArtistsList
		});
	},
	loadMoreByRSS: function(paging_opts, request_info) {
		var _this = this;
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
			});
		return request_info;
	}
});


var user_artists_sp = ['recommended', 'library', 'top:7day', 'top:1month',
		'top:3month', 'top:6month', 'top:12month', 'top:overall'];
var LfmUserArtists = function() {};
BrowseMap.Model.extendTo(LfmUserArtists, {
	model_name: 'lfm_listened_artists',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.initStates();
		this.sub_pa_params = {
			lfm_userid: params.lfm_userid,
			for_current_user: params.for_current_user
		};
		this.userid = params.lfm_userid;
	},
	'nest-lists_list':
		[user_artists_sp],
	'nest-preview_list':
		[user_artists_sp, true],
	sub_pa: {
		'recommended': {
			constr: RecommendatedToUserArtistsList,
			getTitle: function() {
				return this.userid ? (localize('reccoms-for') + ' ' + this.userid) : localize('reccoms-for-you');
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
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);

		connectUserid.call(this, params);

		this.initStates();
	},
	getRqData: function() {
		if (!this.slice_time_end){
			this.slice_time_end = (new Date()/1000).toFixed();
		}
		return {
			user: this.state('userid'),
			extended: 1,
			to: this.slice_time_end,
			nowplaying: true
		};
	},
	
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('recenttracks'),
		['lfm', 'get', function() {
			return ['user.getRecentTracks', this.getRqData()];
		}]
	]
});
var user_tracks_sp = [
	'loved', 'recent', 'top:7day', 'top:1month',
	'top:3month', 'top:6month', 'top:12month', 'top:overall'];
var LfmUserTracks = function() {};
BrowseMap.Model.extendTo(LfmUserTracks, {
	model_name: 'lfm_listened_tracks',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.initStates();

		this.sub_pa_params = {
			lfm_userid: params.lfm_userid,
			for_current_user: params.for_current_user
		};


	},
	'nest-lists_list':
		[user_tracks_sp],
	'nest-preview_list':
		[user_tracks_sp, true],
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
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		connectUserid.call(this, params);

		/*
		this._super.apply(this, arguments);
		this.artist = params.artist;
		this.updateManyStates({
			'nav_title': 'Albums of ' + this.artist + ' from last.fm',
			'url_part': '/albums_lfm'
		});*/
	},
	access_desc: localize('lastfm-reccoms-access'),
	page_limit: 50,
	getRqData: function() {
		return {
			user: this.state('userid'),
			userecs: this.recomms ? 1 : 0
		};
	},
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('albums'),
		['lfm', 'get', function() {
			return ['user.getNewReleases', this.getRqData()];
		}]
	]
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
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		connectUserid.call(this, params);
		this.timeword = params.timeword;
		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('userid'),
			period: this.timeword
		};
	},
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('topalbums'),
		['lfm', 'get', function() {
			return ['user.getTopAlbums', this.getRqData()];
		}]
	],
	hp_bound: {
		timeword: null,
		for_current_user: null,
		lfm_userid: null
	},
	data_by_urlname: {
		timeword: 'name_spaced'
	}
});



var user_albums_sp = ['recommended', 'new_releases', 'top:7day', 'top:1month',
		'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var LfmUserAlbums = function() {};
BrowseMap.Model.extendTo(LfmUserAlbums, {
	model_name: 'lfm_listened_albums',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.initStates();

		this.sub_pa_params = {
			lfm_userid: params.lfm_userid,
			for_current_user: params.for_current_user
		};
		this.userid = params.lfm_userid;
		this.fcuser = params.for_current_user;

	},
	'nest-lists_list':
		[user_albums_sp],
	'nest-preview_list':
		[user_albums_sp, true],
	
	sub_pa: {
		'recommended': {
			constr: RecommNewReleases,
			getTitle: function() {
				var base = 'new releases of artists recommended for ';
				return base + (this.fcuser ? 'you' : this.userid);
			}
		},
		'new_releases': {
			constr: UserLibNewReleases,
			getTitle: function() {
				var base = 'new releases of artists from %user% library';
				return base.replace('%user%', this.fcuser ? 'your' : this.userid);
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
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);

		this.tag_name = params.tag_name;
		connectUserid.call(this, params);

		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('userid'),
			taggingtype: 'track',
			tag: this.tag_name
		};
	},
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('taggings.tracks', false, 'taggings'),
		['lfm', 'get', function() {
			return ['user.getPersonalTags', this.getRqData()];
		}]
	]
});

var TaggedArtists = function() {};
ArtCard.ArtistsList.extendTo(TaggedArtists, {
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		connectUserid.call(this, params);

		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('userid'),
			taggingtype: 'artist',
			tag: this.tag_name
		};
	},
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('taggings.artists', false, 'taggings'),
		['lfm', 'get', function() {
			return ['user.getPersonalTags', this.getRqData()];
		}]
	]
});


var TaggedAlbums = function() {};
ArtCard.AlbumsList.extendTo(TaggedAlbums, {
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.tag_name = params.tag_name;
		connectUserid.call(this, params);
		this.initStates();
	},
	page_limit: 50,
	getRqData: function() {
		return {
			user: this.state('userid'),
			taggingtype: 'album',
			tag: this.tag_name
		};
	},
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('taggings.albums', false, 'taggings'),
		['lfm', 'get', function() {
			return ['user.getPersonalTags', this.getRqData()];
		}]
	]
});

var user_tag_sp = ['artists', 'tracks', 'albums'];
var UserTag = function() {};
BrowseMap.Model.extendTo(UserTag, {
	model_name: 'lfm_user_tag',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		var tag_name = params.data.tag_name;
		this.sub_pa_params = {
			lfm_userid: params.lfm_userid,
			for_current_user: params.for_current_user,
			tag_name: tag_name
		};
		this.initStates({
			tag_name: tag_name,
			count: params.data.count,
			nav_title: tag_name,
			url_part: tag_name
		});

	},
	'nest-lists_list':
		[user_tag_sp],
	'nest-preview_list':
		[user_tag_sp, true],
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
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		connectUserid.call(this, params);
		this.sub_pa_params = {
			lfm_userid: params.lfm_userid,
			for_current_user: params.for_current_user
		};
		this.initStates();
	},
	page_limit: 3000,
	getRqData: function() {
		return {
			user: this.state('userid')
		};
	},
	'nest_req-tags': [
		[
			{
				is_array: true,
				source: 'toptags.tag',
				props_map: {
					tag_name: 'name',
					count: null
				}
			}
		],
		['lfm', 'get', function() {
			return ['user.getTopTags', this.getRqData()];
		}]
	],
	
	makeDataItem:function(data) {
		return this.initSi(UserTag, spv.cloneObj({
			data: data
		}, this.sub_pa_params));
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
	}
});

var LfmUserPreview = function() {};
BrowseMap.Model.extendTo(LfmUserPreview, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
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
		var image = data.lfm_img || data.lfm_image && this.app.art_images.getImageRewrap(data.lfm_image);

		this.initStates({
			selected_image: image,
			nav_title: data.userid,
			userid: data.userid,
			registered: data.registered,
			realname: data.realname,
			age: data.age,
			gender: data.gender,
			country: data.country,
			lfm_img: image,
			song: song,
			song_time: song_time && song_time.toLocaleString(),
			song_time_raw: song_time,
			scrobbler: data.scrobblesource
		});
		this.rawdata = data;
	},

	'compx-big_desc': [
		['realname', 'age', 'gender', 'country'],
		function(realname, age, gender, country)  {
			var big_desc = [];
			var bide_items = [realname, age, gender, country];
			for (var i = 0; i < bide_items.length; i++) {
				if (bide_items[i]){
					big_desc.push(bide_items[i]);
				}
			}
			return big_desc.join(', ');
		}
	],
	showOnMap: function() {
		var md = this.app.getLastfmUser(this.state('userid'));
		md.setProfileData(this.rawdata);
		md.showOnMap();
		//this.app.showLastfmUser(this.state('userid'));
		//this.app.
	}
});




var LfmUsersList = function() {};
LoadableList.extendTo(LfmUsersList, {

	itemConstr: LfmUserPreview,
	makeDataItem:function(data) {
		return this.initSi(this.itemConstr, spv.cloneObj({
			data: data
		}, this.sub_pa_params));
	},
	main_list_name: 'list_items',
	model_name: 'lfm_users',
	page_limit: 200
});
var LfmUsersListOfUser = function() {};
LfmUsersList.extendTo(LfmUsersListOfUser, {
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		connectUserid.call(this, params);
		this.sub_pa_params = {
			lfm_userid: params.lfm_userid,
			for_current_user: params.for_current_user
		};
		this.initStates();
	}
});

var LfmFriendsList = function() {};
LfmUsersListOfUser.extendTo(LfmFriendsList, {
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
		return list;
	},
	
	getRqData: function() {
		return {
			recenttracks: true,
			user: this.state('userid')
		};
	},
	'nest_req-list_items': [
		declr_parsers.lfm.getUsers('friends'),
		['lfm', 'get', function() {
			return ['user.getFriends', this.getRqData()];
		}]
	]
});
var LfmNeighboursList = function() {};
LfmUsersListOfUser.extendTo(LfmNeighboursList, {
	getRqData: function() {
		return {
			user: this.state('userid')
		};
	},
	'nest_req-list_items': [
		declr_parsers.lfm.getUsers('neighbours'),
		['lfm', 'get', function() {
			return ['user.getNeighbours', this.getRqData()];
		}]
	]
});

return {
	LfmUserArtists:LfmUserArtists,
	LfmUserTracks:LfmUserTracks,
	LfmUserTags:LfmUserTags,
	LfmUserAlbums:LfmUserAlbums,
	LfmUsersList: LfmUsersList,
	LfmFriendsList: LfmFriendsList,
	LfmNeighboursList: LfmNeighboursList
};

});