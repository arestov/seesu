define(['app_serv', 'js/libs/BrowseMap', './LoadableList', 'spv', './SongsList', './ArtCard', 'js/LfmAuth', 'js/modules/declr_parsers', 'jquery', 'pv'],
function(app_serv, BrowseMap, LoadableList, spv, SongsList, ArtCard, LfmAuth, declr_parsers, $, pv) {
"use strict";
var ArtistsList = ArtCard.ArtistsList;
var AlbumsList = ArtCard.AlbumsList;

var localize = app_serv.localize;
var pvUpdate = pv.update;
var cloneObj = spv.cloneObj;
//
var UserCardLFMLogin = function() {};
LfmAuth.LfmLogin.extendTo(UserCardLFMLogin, {
	beforeRequest: function() {
		var auth = this.getNesting('auth');
		pvUpdate(auth, 'requested_by', this._provoda_id);
	},
	'compx-active': [
		['has_session', '@one:requested_by:auth'],
		function(has_session, requested_by) {
			return has_session && requested_by == this._provoda_id;
		}
	]
});

var no_access_compx = {
	depends_on: ['userid'],
	fn: function(userid) {
		return !userid;
	}
};

var auth_bh = {
	'compx-has_no_access': no_access_compx,
	pmd_switch_is_parent: true,

	'nest-auth_part': [UserCardLFMLogin, true, 'for_current_user'],

	'compx-userid': [
		['lfm_userid', '#lfm_userid', 'for_current_user'],
		function(lfm_userid, cur_lfm_userid, for_current_user) {
			return (for_current_user ? cur_lfm_userid : lfm_userid) || null;
		}
	],
	'compx-has_lfm_auth': [
		['for_current_user', '@one:has_session:auth_part'],
		function(for_current_user, sess) {
			return for_current_user && sess;
		}
	],

	'compx-parent_focus': [['^mp_has_focus']],
	'stch-has_lfm_auth': function(target, state) {
		if (state) {
			// если появилась авторизация,
			// то нужно выключить предложение авторизоваться
			target.switchPmd(false);
		}
	},
	'stch-parent_focus': function(target, state) {
		if (!state) {
			// если обзорная страница потеряла фокус,
			// то нужно выключить предложение авторизоваться
			target.switchPmd(false);
		}
	},
	'stch-lfm_userid': function(target, state) {
		if (state) {
			target.updateNesting('auth_part', null);
		}
	},
	'compx-acess_ready': [
		['has_no_access', '@one:active:auth_part'],
		function(no_access, active_auth) {
			return !no_access && active_auth;
		}
	],
	'stch-acess_ready': function(target, state) {
		if (state) {
			target.loadStart();
			target.showOnMap();
		}
	}
};

//LULA - LfmUserLibraryArtist
//
var LULATracks = function() {};//непосредственно список композиций артиста, которые слушал пользователь
SongsList.extendTo(LULATracks, cloneObj({
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('tracks'),
		['lfm', 'get', function() {
			return ['library.getTracks', {
				user: this.state('userid'),
				artist: this.head.artist_name
			}];
		}]
	]
}, auth_bh));

var slashPrefix = function(src) {
	return '/' + src;
};

var LULA = function() {};//artist, один артист с треками
BrowseMap.Model.extendTo(LULA, cloneObj({
	model_name: 'lula',
	netdata_as_states: {
		url_part: [slashPrefix, 'artist'],
		nav_title: 'artist',
		artist_name: 'artist',
		playcount: null,
		lfm_image: 'lfm_img'
	},
	net_head: ['artist_name'],
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
	}
}, auth_bh));


var UserArtists = function() {};
LoadableList.extendTo(UserArtists, {
	model_name: 'lulas',
	main_list_name: 'artists',
	'nest_rqc-artists': LULA,
	'compx-has_no_access': no_access_compx
});

// var LULAs = function() {};//artists, список артистов
// UserArtists.extendTo(LULAs, cloneObj({
// 	'nest_req-artists': [
// 		declr_parsers.lfm.getArtists('artists'),
// 		['lfm', 'get', function() {
// 			return ['library.getArtists', {
// 				user: this.state('userid')
// 			}];
// 		}]
// 	]

// }, auth_bh));

var TopLUArt = function() {};
UserArtists.extendTo(TopLUArt, cloneObj({
	'nest_rqc-artists': LULA,
	'nest_req-artists': [
		declr_parsers.lfm.getArtists('topartists'),
		['lfm', 'get', function() {
			return ['user.getTopArtists', {
				user: this.state('userid'),
				period: this.head.timeword
			}];
		}]
	],
	head_by_urlname: {
		timeword: 'name_spaced'
	}
}, auth_bh));


var TopUserTracks = function() {};
SongsList.extendTo(TopUserTracks, cloneObj({
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('toptracks'),
		['lfm', 'get', function() {
			return ['user.getTopTracks', {
				user: this.state('userid'),
				period: this.head.timeword
			}];
		}]
	],
	head_by_urlname: {
		timeword: 'name_spaced'
	}
}, auth_bh));


var LfmLovedList = function() {};
SongsList.extendTo(LfmLovedList, cloneObj({
	access_desc: localize('grant-love-lfm-access'),
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('lovedtracks'),
		['lfm', 'get', function() {
			return ['user.getLovedTracks', {
				user: this.state('userid')
			}];
		}]
	]
}, auth_bh));

var RecommArtList = function() {};
ArtistsList.extendTo(RecommArtList, cloneObj({
	page_limit: 30,
	access_desc: localize('lastfm-reccoms-access'),
	'compx-loader_disallowed': [
		['loader_disallowed'],
		function() {
			return !app_serv.app_env.cross_domain_allowed;
		}
	],
	'nest_req-artists_list': [
		[function(xml) {
			var data_list = [];
			var artists = $(xml).find('channel item title');
			if (artists && artists.length) {
				for (var i=0, l = (artists.length < 30) ? artists.length : 30; i < l; i++) {
					var artist = $(artists[i]).text();
					data_list.push({
						artist: artist
					});
				}
			}
			return data_list;
		}],
		[function() {
			return {
				api_name: 'last_fm_xml',
				source_name: 'last.fm',
				get: function(url) {
					return $.ajax({
						url: 'http://ws.audioscrobbler.com/1.0/' + url,
						type: "GET",
						dataType: "xml"
					});
				},
				errors_fields: []
			};

		}, 'get', function() {
			return ['user/' + this.state('userid') + '/systemrecs.rss'];
		}]
	]
}, auth_bh));

var RecommArtListForCurrentUser = function() {};
RecommArtList.extendTo(RecommArtListForCurrentUser, {
	'compx-loader_disallowed': null,
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('recommendations'),
		['lfm', 'get', function() {
			return ['user.getRecommendedArtists', {
				sk: this.app.lfm.sk
			}];
		}]
	]
});

var user_artists_sp = ['recommended', /*'library',*/ 'top:7day', /* 'top:1month',*/
	'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var LfmUserArtists = function() {};
BrowseMap.Model.extendTo(LfmUserArtists, {
	model_name: 'lfm_listened_artists',
	'nest-lists_list':
		[user_artists_sp],
	'nest-preview_list':
		[user_artists_sp, true],
	sub_pa: {
		'recommended': {
			constr: RecommArtList,
			getTitle: function() {
				return localize('reccoms-for') + ' ' + this.head.userid;
			}
		},
		// 'library': {
		// 	constr: LULAs,
		// 	title: 'library'
		// },
		'top:7day': {
			constr: TopLUArt,
			title: 'top of 7day'
		},
		/*'top:1month':{
			constr: TopLUArt,
			title: 'top of month'
		},*/
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

LfmUserArtists.LfmUserArtistsForCU = function() {};
LfmUserArtists.extendTo(LfmUserArtists.LfmUserArtistsForCU, {
	'sub_pa-recommended': {
		constr: RecommArtListForCurrentUser,
		title: localize('reccoms-for-you')
	}
});



var LfmRecentUserTracks = function() {};
SongsList.extendTo(LfmRecentUserTracks, cloneObj({
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
}, auth_bh));

var user_tracks_sp = [
	'loved', 'recent', 'top:7day', /*'top:1month',*/
	'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var LfmUserTracks = function() {};
BrowseMap.Model.extendTo(LfmUserTracks, {
	model_name: 'lfm_listened_tracks',
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
		/*'top:1month':{
			constr: TopUserTracks,
			title: 'top of month'
		},*/
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
AlbumsList.extendTo(UserNewReleases, cloneObj({
	access_desc: localize('lastfm-reccoms-access'),
	page_limit: 50,
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('albums'),
		['lfm', 'get', function() {
			return ['user.getNewReleases', {
				user: this.state('userid'),
				userecs: this.recomms ? 1 : 0
			}];
		}]
	]
}, auth_bh));

var UserLibNewReleases= function() {};
UserNewReleases.extendTo(UserLibNewReleases, {
});

var RecommNewReleases = function() {};
UserNewReleases.extendTo(RecommNewReleases, {
	recomms: true
});


var LfmUserTopAlbums = function() {};
AlbumsList.extendTo(LfmUserTopAlbums, cloneObj({
	head_by_urlname: {
		timeword: 'name_spaced'
	},
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('topalbums'),
		['lfm', 'get', function() {
			return ['user.getTopAlbums', {
				user: this.state('userid'),
				period: this.head.timeword
			}];
		}]
	]
}, auth_bh));



var user_albums_sp = ['recommended', 'new_releases', 'top:7day', /*'top:1month',*/
		'top:3month', 'top:6month', 'top:12month', 'top:overall'];

var LfmUserAlbums = function() {};
BrowseMap.Model.extendTo(LfmUserAlbums, {
	model_name: 'lfm_listened_albums',
	'nest-lists_list':
		[user_albums_sp],
	'nest-preview_list':
		[user_albums_sp, true],

	sub_pa: {
		'recommended': {
			constr: RecommNewReleases,
			getTitle: function() {
				var base = 'new releases of artists recommended for ';
				return base + (this.head.for_current_user ? 'you' : this.head.lfm_userid);
			}
		},
		'new_releases': {
			constr: UserLibNewReleases,
			getTitle: function() {
				var base = 'new releases of artists from %user% library';
				return base.replace('%user%', this.head.for_current_user ? 'your' : this.head.lfm_userid);
			}
		},
		'top:7day':{
			constr: LfmUserTopAlbums,
			title: 'Top of 7 days'
		},
		/*'top:1month':{
			constr: LfmUserTopAlbums,
			title: 'Top of 1 month'
		},*/
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
SongsList.extendTo(TaggedSongs, cloneObj({
	'nest_req-songs-list': [
		declr_parsers.lfm.getTracks('taggings.tracks', false, 'taggings'),
		['lfm', 'get', function() {
			return ['user.getPersonalTags', {
				user: this.state('userid'),
				taggingtype: 'track',
				tag: this.head.tag_name
			}];
		}]
	]
}, auth_bh));

var TaggedArtists = function() {};
ArtistsList.extendTo(TaggedArtists, cloneObj({
	'nest_req-artists_list': [
		declr_parsers.lfm.getArtists('taggings.artists', false, 'taggings'),
		['lfm', 'get', function() {
			return ['user.getPersonalTags', {
				user: this.state('userid'),
				taggingtype: 'artist',
				tag: this.head.tag_name
			}];
		}]
	]
}, auth_bh));


var TaggedAlbums = function() {};
AlbumsList.extendTo(TaggedAlbums, cloneObj({
	page_limit: 50,
	'nest_req-albums_list': [
		declr_parsers.lfm.getAlbums('taggings.albums', false, 'taggings'),
		['lfm', 'get', function() {
			return ['user.getPersonalTags', {
				user: this.state('userid'),
				taggingtype: 'album',
				tag: this.head.tag_name
			}];
		}]
	]
}, auth_bh));

var user_tag_sp = ['artists', 'tracks', 'albums'];
var UserTag = function() {};
BrowseMap.Model.extendTo(UserTag, {
	model_name: 'lfm_user_tag',
	net_head: ['tag_name'],
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
LoadableList.extendTo(LfmUserTags, cloneObj({
	model_name: 'lfm_listened_tags',
	main_list_name: 'tags',
	page_limit: 3000,
	'nest_req-tags': [
		[
			{
				is_array: true,
				source: 'toptags.tag',
				props_map: {
					nav_title: 'name',
					url_part: 'name',
					tag_name: 'name',
					count: null
				}
			}
		],
		['lfm', 'get', function() {
			return ['user.getTopTags', {
				user: this.state('userid')
			}];
		}]
	],
	'nest_rqc-tags': UserTag,


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
}, auth_bh));

var LfmUserPreview = function() {};
BrowseMap.Model.extendTo(LfmUserPreview, {
	init: function(opts, data) {
		this._super.apply(this, arguments);

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
	getRelativeModel: function() {
		var md = this.app.getLastfmUser(this.state('userid'));
		md.setProfileData(this.rawdata);
		return md;
	},
	showOnMap: function() {
		var md = this.getRelativeModel();
		md.showOnMap();
		//this.app.showLastfmUser(this.state('userid'));
		//this.app.
	}
});




var LfmUsersList = function() {};
LoadableList.extendTo(LfmUsersList, {
	'nest_rqc-list_items': LfmUserPreview,

	main_list_name: 'list_items',
	model_name: 'lfm_users',
	page_limit: 200
});

var LfmUsersListOfUser = function() {};
LfmUsersList.extendTo(LfmUsersListOfUser, cloneObj({
}, auth_bh));

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
	'nest_req-list_items': [
		declr_parsers.lfm.getUsers('friends'),
		['lfm', 'get', function() {
			return ['user.getFriends', {
				recenttracks: true,
				user: this.state('userid')
			}];
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
