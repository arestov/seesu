define(['provoda', 'spv', 'app_serv', './comd', 'jquery',
'js/libs/BrowseMap', './SongsList', './ArtCard' , 'js/common-libs/htmlencoding',
'./UserAcquaintancesLists', './SuUsersPlaylists', './user_music_lfm', './user_music_vk'],
function(provoda, spv, app_serv, comd, $,
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
			constr: user_music_lfm.LfmUserArtists,
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
	init: function(opts, params) {
		this._super.apply(this, arguments);

		this.urp_name = params.urp_name;
		this.for_current_user = true;//this.urp_name == 'me' || params.for_current_user;
		this.sub_pa_params = {
			for_current_user: this.for_current_user
		};
		this.init_states['nav_title'] = localize('your-pmus-f-aq');
		this.initStates();

		var _this = this;
		if (this.for_current_user){
			this.wch(this.map_parent, 'can_expand');

		}

		

		this.lists_list = ['playlists', 'vk:tracks', 'vk:friends', 'lfm:friends', 'lfm:neighbours','lfm:artists', 'lfm:tracks', 'lfm:tags', 'lfm:albums'];
		this.initSubPages(this.lists_list);

		var networks_pages = ['vk:tracks', 'vk:friends', 'lfm:friends', 'lfm:neighbours', 'lfm:artists', 'lfm:tracks', 'lfm:tags', 'lfm:albums'];
		for (var i = 0; i < networks_pages.length; i++) {
			var cur = networks_pages[i];
			this.updateNesting(cur.replace(':', '__'), this.getSPI(cur));
		}

		//плейлисты
		var gena = this.getSPI('playlists', true);
		this.updateNesting('user-playlists', gena);
		var hasPlaylistCheck = function(items) {
			_this.updateState('has_playlists', !!items.length);
		};
		hasPlaylistCheck(this.app.gena.playlists);
		this.app.gena.on('playlsits-change', hasPlaylistCheck);

		//знакомства
		var users_acqutes = new UserAcquaintancesLists();
		users_acqutes.init({
			app: this.app,
			map_parent: this
		});
		this.updateNesting('users_acqutes', users_acqutes);
		
		
		return this;
	},
	'stch-mp_show': function(state) {
		if (state && state.userwant){
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
	}
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
	init: function(opts, params) {
		this._super(opts);
		this.urp_name = params.urp_name;
		if (this.urp_name.search(/^vk\:/) != -1){
			this.vk_userid = this.urp_name.replace(/^vk\:/,'');
		}
		this.sub_pa_params = {
			vk_userid: this.vk_userid
		};
		this.init_states['userid'] = this.vk_userid;
		this.init_states['p_nav_title'] = 'Vk.com user: ' + this.vk_userid;
		this.initStates();
		this.rq_b = {};
		this.lists_list = ['friends', 'tracks'];
		this.initSubPages(this.lists_list);

		var networks_pages = ['friends', 'tracks'];
		for (var i = 0; i < networks_pages.length; i++) {
			var cur = networks_pages[i];
			this.updateNesting('vk__' + cur, this.getSPI(cur));
		}
	},
	'stch-mp_show': function(state) {
		if (state && state.userwant){
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
	init: function(opts, params) {
		this._super(opts);
		this.urp_name = params.urp_name;
		if (this.urp_name.search(/^lfm\:/) != -1){
			this.lfm_userid = this.urp_name.replace(/^lfm\:/,'');
		}
		this.sub_pa_params = {
			lfm_userid: this.lfm_userid
		};
		this.init_states['userid'] = this.lfm_userid;
		this.init_states['nav_title'] = 'Last.fm user: ' + this.lfm_userid;
		this.initStates();
		this.rq_b = {};
		this.lists_list = ['friends', 'neighbours', 'artists', 'tracks', 'tags', 'albums'];
		this.initSubPages(this.lists_list);

		var networks_pages = ['friends', 'neighbours', 'artists', 'tracks', 'tags', 'albums'];
		for (var i = 0; i < networks_pages.length; i++) {
			var cur = networks_pages[i];
			this.updateNesting('lfm__' + cur, this.getSPI(cur));
		}
	},
	loadInfo: function() {
		if (!this.rq_b.done && !this.rq_b.progress){
			if (!this.state('registered')){
				this.rq_b.progress = true;
				this.updateState('loading_info', true);
				var _this = this;
				this.addRequest(this.app.lfm.get('user.getInfo', {'user': this.lfm_userid})
					.done(function(r){
						if (!r.error){
							_this.rq_b.done = true;
							var data = user_music_lfm.LfmFriendsList.parseUserInfo(r.user);
							if (data.lfm_image){
								data.lfm_image = _this.app.art_images.getImageRewrap(data.lfm_image);
							}
								
							_this.updateManyStates(data);
						}
					})
					.fail(function(){

					})
					.always(function() {
						_this.updateState('loading_info', false);
						_this.rq_b.progress = false;
					})
				);
			}
		}
	},
	'stch-mp_show': function(state) {
		if (state && state.userwant){
			this.loadInfo();
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