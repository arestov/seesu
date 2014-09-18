define(['pv', 'spv', 'app_serv', './comd', 'jquery',
'js/libs/BrowseMap', './SongsList', './ArtCard' , 'js/common-libs/htmlencoding',
'./UserAcquaintancesLists', './SuUsersPlaylists', './user_music_lfm', './user_music_vk'],
function(pv, spv, app_serv, comd, $,
BrowseMap, SongsList, ArtCard, htmlencoding,
UserAcquaintancesLists, SuUsersPlaylists, user_music_lfm, user_music_vk){
"use strict";
var localize = app_serv.localize;

var UsersList = function() {};
BrowseMap.Model.extendTo(UsersList, {
	
});



var UserCard = function() {};

BrowseMap.Model.extendTo(UserCard, {
	model_name: 'usercard',
	sub_pa: {
		'vk:tracks': {
			constr: user_music_vk.VkUserTracks,
			title: localize('vk.com tracks')
		},
		'vk:friends': {
			constr: user_music_vk.VKFriendsList,
			title: localize('vk.com friends')
		},
		'playlists':{
			constr: SuUsersPlaylists
		},
		'acquaintances':{
			constr: UserAcquaintancesLists,
			title: localize("Acquaintances")
		},
		'lfm:friends': {
			constr: user_music_lfm.LfmFriendsList,
			title: localize("Last.fm friends")
		},
		'lfm:neighbours':{
			constr: user_music_lfm.LfmNeighboursList,
			title: localize("Neighbours")
		},
		'lfm:artists':{
			constr: user_music_lfm.LfmUserArtists.LfmUserArtistsForCU,
			title: localize('Artists')
		},
		'lfm:tracks':{
			constr: user_music_lfm.LfmUserTracks,
			title: localize('Tracks')
		},
		'lfm:tags':{
			constr: user_music_lfm.LfmUserTags,
			title: localize('Tags')
		},
		'lfm:albums':{
			constr: user_music_lfm.LfmUserAlbums,
			title: localize('Albums')
		}
	},
	nest: (function() {
		var result = {
			'user-playlists': ['playlists'],
			'users_acqutes': ['acquaintances'],
			'preload_list': [['vk:friends', 'lfm:tags', 'lfm:friends', 'lfm:neighbours'], true]
		};


		var networks_pages = ['vk:tracks', 'vk:friends', 'lfm:friends', 'lfm:neighbours', 'lfm:artists', 'lfm:tracks', 'lfm:tags', 'lfm:albums'];
		for (var i = 0; i < networks_pages.length; i++) {
			var cur = networks_pages[i];
			result[cur.replace(':', '__')] = [cur];
		}

		return result;
	})(),
	init: function() {
		this._super.apply(this, arguments);

		
		this.for_current_user = true;
		this.sub_pa_params = {
			for_current_user: this.for_current_user
		};
		this.init_states['nav_title'] = localize('your-pmus-f-aq');
		this.initStates();

		var _this = this;
		if (this.for_current_user){
			this.wch(this.map_parent, 'can_expand');

		}

		

		

		//плейлисты
		var gena = this.getSPI('playlists', true);
		var hasPlaylistCheck = function(items) {
			_this.updateState('has_playlists', !!items.length);
		};
		hasPlaylistCheck(this.app.gena.playlists);
		this.app.gena.on('playlists-change', hasPlaylistCheck);

		//знакомства


		
		
		return this;
	},
	
	/*'stch-mp_has_focus': function(state) {
		if (state){
			var list_to_preload = [
				this.getNesting('vk__friends'),
				this.getNesting('lfm__tags'),
				this.getNesting('lfm__friends'),
				this.getNesting('lfm__neighbours')

			];
			for (var i = 0; i < list_to_preload.length; i++) {
				var cur = list_to_preload[i];
				if (cur){
					cur.preloadStart();
				}
			}
		}
	}*/
});
var VkUserCard = function() {};
BrowseMap.Model.extendTo(VkUserCard, {
	model_name: 'vk_usercard',
	sub_pa: {
		'tracks': {
			constr: user_music_vk.VkUserTracks,
			title: localize('Tracks')
		},
		'friends': {
			constr: user_music_vk.VKFriendsList,
			title: localize('Friends')
		}
	},
	'compx-big_desc': {
		depends_on: ['first_name', 'last_name'],
		fn: function(first_name, last_name){
			return [first_name, last_name].join(' ');
		}
	},
	'compx-nav_title': {
		depends_on: ['big_desc', 'p_nav_title'],
		fn: function(big_desc, p_nav_title){
			return (big_desc && 'Vk.com user: ' + big_desc) || p_nav_title;
		}
	},
	setProfileData: function(data) {
		/*if (data.lfm_image){
			data.lfm_image = this.app.art_images.getImageRewrap(data.lfm_image);
		}*/
		var result = {};
		for (var state in data){
			if (!this.state(state)){
				result[state] = data[state];
			}
		}

		this.updateManyStates(result);
	},
	init: function(opts, data) {
		this._super.apply(this, arguments);
		this.vk_userid = data.userid;

		this.sub_pa_params = {
			vk_userid: this.vk_userid
		};
		this.init_states['userid'] = this.vk_userid;
		this.init_states['p_nav_title'] = 'Vk.com user: ' + this.vk_userid;
		this.initStates();
		this.rq_b = {};

		

		
	},
	nest: (function() {
		var result = {};

		var networks_pages = ['friends', 'tracks'];
		for (var i = 0; i < networks_pages.length; i++) {
			var cur = networks_pages[i];
			result[ 'vk__' + cur ] = [cur];
		}

		return result;

	})(),
	req_map: [
		[
			['first_name', 'last_name', 'photo', 'ava_image', 'selected_image'],
			{
				source: 'response.0',
				props_map: {

					first_name: 'first_name',
					last_name: 'last_name',
					photo: 'photo',
					'ava_image.url': 'photo_medium',
					'selected_image.url': 'photo'
				}
			},
			['vk_api', 'get', function() {
				return ['users.get', {
					user_ids: [this.state('userid')],
					fields: ['id', 'first_name', 'last_name', 'sex', 'photo', 'photo_medium', 'photo_big'].join(',')
				}];
			}]
		]
	],
	'stch-mp_has_focus': function(state) {
		if (state){

			this.requestState('first_name', 'last_name', 'photo', 'ava_image');


			var list_to_preload = [
				this.getNesting('vk__friends')

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

var LfmUserCard = function() {};
BrowseMap.Model.extendTo(LfmUserCard, {
	model_name: 'lfm_usercard',
	init: function(opts, data) {
		this._super.apply(this, arguments);
		this.lfm_userid = data.userid;

		this.sub_pa_params = {
			lfm_userid: this.lfm_userid
		};
		this.init_states['userid'] = this.lfm_userid;
		this.init_states['nav_title'] = 'Last.fm user: ' + this.lfm_userid;
		this.initStates();
		this.rq_b = {};

		

		
	},
	nest: (function() {
		var result = {};
		var networks_pages = ['friends', 'neighbours', 'artists', 'tracks', 'tags', 'albums'];
		for (var i = 0; i < networks_pages.length; i++) {
			var cur = networks_pages[i];
			result[ 'lfm__' + cur ] = [cur];
		}

		return result;
	})(),
	sub_pa: {
		'friends': {
			constr: user_music_lfm.LfmFriendsList,
			title: localize("Friends")
		},
		'neighbours':{
			constr: user_music_lfm.LfmNeighboursList,
			title: localize('Neighbours')
		},
		'artists':{
			constr: user_music_lfm.LfmUserArtists,
			title: localize('Artists')
		},
		'tracks':{
			constr: user_music_lfm.LfmUserTracks,
			title: localize('Tracks')
		},
		'tags':{
			constr: user_music_lfm.LfmUserTags,
			title: localize('Tags')
		},
		'albums':{
			constr: user_music_lfm.LfmUserAlbums,
			title: localize('Albums')
		}
	},
	setProfileData: function(data) {
		if (data.lfm_image){
			data.lfm_image = this.app.art_images.getImageRewrap(data.lfm_image);
		}
		var result = {};
		for (var state in data){
			if (!this.state(state)){
				result[state] = data[state];
			}
		}

		this.updateManyStates(result);
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
	req_map: [
		[
			['userid', 'realname', 'country', 'age', 'gender', 'playcount', 'playlists', 'lfm_img', 'registered', 'scrobblesource', 'recenttrack'],
			{
				source: 'user',
				props_map: {
					userid: 'name',
					realname: null,
					country: null,
					age: ['num', 'age'],
					gender: null,
					playcount: ['num', 'playcount'],
					playlists: ['num', 'playlists'],
					lfm_img: ['lfm_image', 'image'],
					registered: ['timestamp', 'registered'],
					scrobblesource: null,
					recenttrack: null
				}
			},
			['lfm', 'get', function() {
				return ['user.getInfo', {'user': this.lfm_userid}];
			}]
		]
	],
	'stch-mp_has_focus': function(state) {
		if (state){
			this.requestState('realname', 'country', 'age', 'gender');
			var list_to_preload = [
				this.getNesting('lfm__tags'),
				this.getNesting('lfm__friends'),
				this.getNesting('lfm__neighbours')

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
UserCard.LfmUserCard = LfmUserCard;
UserCard.VkUserCard = VkUserCard;

var SongListener = function() {};
pv.Model.extendTo(SongListener, {
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