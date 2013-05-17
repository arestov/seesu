define(['provoda', 'spv', 'app_serv', './comd', 'jquery',
'js/libs/BrowseMap', './SongsList', './ArtCard' , 'js/common-libs/htmlencoding', './UserAcquaintancesLists', './SuUsersPlaylists', './lfm_user_music'],
function(provoda, spv, app_serv, comd, $,
BrowseMap, SongsList, ArtCard, htmlencoding, UserAcquaintancesLists, SuUsersPlaylists, lfm_user_music ){
"use strict";
var localize = app_serv.localize;



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



var UserCard = function() {};

BrowseMap.Model.extendTo(UserCard, {
	model_name: 'usercard',
	sub_pa: {
		'vk-audio': {
			constr: MyVkAudioList,
			getTitle: function() {
				return localize('vk-audio');
			}
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

		this.lists_list = ['playlists', 'vk-audio', 'lfm:artists', 'lfm:tracks', 'lfm:tags', 'lfm:albums'];
		this.initSubPages(this.lists_list);

		//this.updateNesting('lists_list', this.lists_list);
		//this.updateNesting('preview_list', this.lists_list);



		/*
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
*/
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