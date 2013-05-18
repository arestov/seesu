define(['provoda', 'spv', 'app_serv', './comd', 'jquery',
'js/libs/BrowseMap', './SongsList', './ArtCard' , 'js/common-libs/htmlencoding',
'./UserAcquaintancesLists', './SuUsersPlaylists', './lfm_user_music', './vk_user_music'],
function(provoda, spv, app_serv, comd, $,
BrowseMap, SongsList, ArtCard, htmlencoding,
UserAcquaintancesLists, SuUsersPlaylists, lfm_user_music, vk_user_music){
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
			constr: vk_user_music.VkUserTracks,
			title: 'Tracks'
		},
		'playlists':{
			constr: SuUsersPlaylists
		},
		'acquaintances':{

		},
		'lfm:artists':{
			constr: lfm_user_music.LfmUserArtists,
			title:'Artists'
		},
		'lfm:tracks':{
			constr: lfm_user_music.LfmUserTracks,
			title:'Tracks'
		},
		'lfm:tags':{
			constr: lfm_user_music.LfmUserTags,
			title:'Tags'
		},
		'lfm:albums':{
			constr: lfm_user_music.LfmUserAlbums,
			title:'Albums'
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
		if (this.urp_name.search(/^lfm\:/) != -1){
			this.lfm_username = this.urp_name.replace(/^lfm\:/,'');
		}
		this.sub_pa_params = {
			lfm_username: this.lfm_username,
			for_current_user: this.for_current_user,
			vk_id: null
		};

		var _this = this;

		this.lists_list = ['playlists', 'vk:tracks', 'lfm:artists', 'lfm:tracks', 'lfm:tags', 'lfm:albums'];
		this.initSubPages(this.lists_list);

		//this.updateNesting('lists_list', this.lists_list);
		//this.updateNesting('preview_list', this.lists_list);


		var networks_pages = ['vk:tracks', 'lfm:artists', 'lfm:tracks', 'lfm:tags', 'lfm:albums'];
		for (var i = 0; i < networks_pages.length; i++) {
			var cur = networks_pages[i];
			this.updateNesting(cur.replace(':', '__'), this.getSPI(cur));
		}

		var gena = this.getSPI('playlists', true);
		
		this.updateNesting('user-playlists', gena);

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
				this.getNesting('lfm__tags')
				

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