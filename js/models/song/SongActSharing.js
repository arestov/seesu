define(['pv', 'spv', 'app_serv', '../invstg', '../comd', 'js/LfmAuth'],
function(pv, spv, app_serv,  invstg, comd, LfmAuth) {
"use strict";
var localize = app_serv.localize;
var app_env = app_serv.app_env;


var struserSuggest = function(wrap) {
	var user = wrap.user;

	this.init();
	this.mo = wrap.mo;
	this.row = wrap.row;
	this.user_id = user.id;
	this.photo = user.photo;
	this.online = this.online;
	//this.name = user.name;
	this.text_title = user.first_name + " " + user.last_name;
	this.updateManyStates({
		photo: user.photo,
		text_title: this.text_title
	});
};
invstg.BaseSuggest.extendTo(struserSuggest, {
	valueOf: function(){
		return this.user_id;
	},
	onView: function(){
		this.mo.postToVKWall(this.user_id);
		this.row.hide();
	}
});

var VKLoginFSearch = function() {};
comd.VkLoginB.extendTo(VKLoginFSearch, {
	init: function(opts) {
		this._super(opts, {
			desc: app_env.vkontakte ? localize('to-find-vk-friends') : localize("to-post-and-find-vk")
		}, {
			open_opts: {settings_bits: 2},
			auth: opts.map_parent.app.vk_auth
		});
	}
});



var StrusersRSSection = function() {};
invstg.SearchSection.extendTo(StrusersRSSection, {
	resItem: struserSuggest,
	model_name: "section-vk-users",
	'compx-can_searchf_vkopt': [
		['vk_opts'],
		function(vk_opts) {
			return (vk_opts & 2) * 1;
		}
	],
	'compx-can_post_to_own_wall': [
		['vk_env', 'has_vk_api'],
		function(vk_env, has_vk_api) {
			return vk_env || has_vk_api;
		}
	],
	'compx-can_search_friends': [
		['vk_env', 'has_vk_api', 'can_searchf_vkopt'],
		function(vk_env, has_vk_api, can_searchf_vkopt) {
			if (vk_env) {
				return !!can_searchf_vkopt;
			} else {
				return !!has_vk_api;
			}
		}
	],
	'compx-needs_vk_auth': [
		['can_search_friends'],
		function(can_search_friends) {
			return !can_search_friends;
		}
	],
	//desc: improve ? 
	'nest-vk_auth': [VKLoginFSearch, false, 'needs_vk_auth'],
	init: function() {
		this._super.apply(this, arguments);
		this.mo = this.map_parent.mo;
		this.rpl = this.map_parent.map_parent;

		this.updateManyStates({
			vk_env: !!app_env.vkontakte,
			has_vk_api: !!this.app.vk_api,
			vk_opts: !!app_env.vkontakte && this.app._url.api_settings
		});

		var _this = this;

		this.app.on("vk-api", function(api) {
			_this.updateState("has_vk_api", !!api);
		});

		if (app_env.vkontakte) {
			this.app.vk_auth.on('settings-change', function(vk_opts) {
				_this.updateState('vk_opts', vk_opts);
			});
		}

		var cu_info = this.app.s.getInfo('vk');
		if (cu_info){
			if (cu_info.photo){
				this.updateState("own_photo", cu_info.photo);
			}
		} else {
			this.app.s.once("info-change.vk", function(cu_info) {
				if (cu_info.photo){
					_this.updateState("own_photo", cu_info.photo);
				}
			});
		}
	},
	'stch-can_search_friends': function(state) {
		if (state){
			this.searchByQuery(this.state('query'));
		}
	},
	searchByQuery: function(query) {
		this.changeQuery(query);
		var _this = this;
		this.app
			.once("vk-friends.share-row", function(list){
				_this.handleVKFriendsSearch(list);
			}, {exlusive: true})
			.getVKFriends();
	},
	handleVKFriendsSearch: function(list){
		var query = this.state('query');
		var r = (query ? spv.searchInArray(list, query, ["first_name", "last_name"]) : list);
		if (r.length){
			r = r.concat();
			for (var i = 0; i < r.length; i++) {
				r[i] = {
					mo: this.mo,
					user: r[i],
					row: this.rpl
				};
			}
		}

		this.appendResults(r, true);
	},
	postToVKWall: function() {
		this.mo.postToVKWall();
	}

});






var LFMUserSuggest = function(params) {
	

	this.init();
	var user = params.user;
	this.app = params.app;
	this.mo = params.mo;
	this.row = params.row;

	this.userid = user.state('userid');
	this.text_title = this.userid;
	this.updateManyStates({
		selected_image: user.state('selected_image'),
		text_title: this.text_title
	});
};
invstg.BaseSuggest.extendTo(LFMUserSuggest, {
	valueOf: function(){
		return this.userid;
	},
	onView: function(){
		var _this = this;
		this.mo.shareWithLFMUser(this.userid);
		_this.row.hide();
		/*.done(function() {
			_this.row.hide();
		});*/
	}
});



var LFMFriendsSection = function() {};
invstg.SearchSection.extendTo(LFMFriendsSection, {
	//'nest-lfm_friends': ['#/users/me/lfm:friends', 'can_share'],
	init: function() {
		this._super.apply(this, arguments);
		this.mo = this.map_parent.mo;
		this.rpl = this.map_parent.map_parent;


		this.lfm_friends = this.app.routePathByModels('/users/me/lfm:friends');
		//su.routePathByModels('/users/me/lfm:neighbours')
		//preloadStart

		this.lfm_friends.on('child_change-list_items', function(e) {
			this.updateNesting('friends', e.value);
			this.changeQuery('');
			this.searchByQuery(this.state('query'));
			

		}, this.getContextOpts());

		this.wch(this, 'can_share', function(e) {
			if (e.value){
				this.lfm_friends.preloadStart();
				this.searchLFMFriends();
			}
			
		});


	},
	searchByQuery: function(query) {
		this.changeQuery(query);
		this.searchLFMFriends();
	},
	'compx-can_share':{
		depends_on: ['^^active_view', '#lfm_userid'],
		fn: function(active_view, lfm_userid) {
			return lfm_userid && active_view;
		}
	},
	searchLFMFriends: function(){
		var list = this.getNesting('friends') || [];
		var query = this.state('query');
		if (!this.state('can_share')){
			return;
		}
		var r = (query ? spv.searchInArray(list, query, ["states.userid", "states.realname"]) : list);
		if (r.length){
			r = r.concat();
			for (var i = 0; i < r.length; i++) {
				r[i] = {
					mo: this.mo,
					user: r[i],
					row: this.rpl
				};
			}
		}
		this.appendResults(r, true);
	},
	resItem: LFMUserSuggest,
	model_name: "section-lfm-friends"
});



var LFMOneUserSuggest = function(params) {
	this.init();
	var user = params.user;
//	
	this.app = params.app;
	this.mo = params.mo;
	this.row = params.row;
	

	this.userid = user.name;
	this.text_title = this.userid;
	this.updateManyStates({
		selected_image: this.app.art_images.getImageWrap(user.image),
		text_title: this.text_title
	});
};
invstg.BaseSuggest.extendTo(LFMOneUserSuggest, {
	valueOf: function(){
		return this.userid;
	},
	onView: function(){
		var _this = this;
		this.mo.shareWithLFMUser(this.userid);
		_this.row.hide();
		/*.done(function() {
			_this.row.hide();
		});*/
		
	}
});




var LFMOneUserSection = function() {};
invstg.SearchSection.extendTo(LFMOneUserSection, {
	init: function() {
		this._super.apply(this, arguments);
		this.mo = this.map_parent.mo;
		this.rpl = this.map_parent.map_parent;

		this.wch(this, 'can_share', function(e) {
			if (e.value){
				this.searchLFMFriends();
			}
		});

	},
	searchByQuery: function(query) {
		this.changeQuery(query);
		this.searchOneUser();
	},
	'compx-can_share':{
		depends_on: ['^^active_view', '#lfm_userid'],
		fn: function(active_view, lfm_userid) {
			return lfm_userid && active_view;
		}
	},
	searchOneUser: spv.debounce(function() {
		var _this = this;

		var q = this.state('query');
		if (!q){
			return;
		}
		if (!this.state('can_share')){
			return;
		}

		this.loading();
		this.addRequest(
			this.app.lfm
				.get('user.getInfo', {user: q})
					.done(function(r){
						if (!_this.doesNeed(q)){return;}
						_this.loaded();

						var result = [];
						if (r.user && r.user.name){
							result.push({
								mo: _this.mo,
								row: _this.rpl,
								app: _this.app,

								user: r.user
								
							});
					
						}
						//r = r && parser(r, this.resItem, method);
						_this.appendResults(result, true);

						
					})
					.fail(function(){
						if (!_this.doesNeed(q)){return;}
						_this.loaded();
					}));
	}, 200),
	searchLFMFriends: function(){
		var list = this.getNesting('friends') || [];
		var query = this.state('query');
		var r = (query ? spv.searchInArray(list, query, ["states.userid", "states.realname"]) : list);
		if (r.length){
			r = r.concat();
			for (var i = 0; i < r.length; i++) {
				r[i] = {
					mo: this.mo,
					user: r[i],
					row: this.rpl
				};
			}
		}
		this.appendResults(r, true);
	},
	resItem: LFMOneUserSuggest,
	model_name: "section-lfm-user"
});


var LfmSharingAuth = function() {};
LfmAuth.LfmLogin.extendTo(LfmSharingAuth, {
	access_desc: localize('lastfm-sharing-access')
});

var StrusersRowSearch = function() {};
invstg.Investigation.extendTo(StrusersRowSearch, {
	skip_map_init: true,
	'nest-lfm_auth': [LfmSharingAuth],
	'nest-section': [[StrusersRSSection, LFMFriendsSection, LFMOneUserSection]],
	init: function() {
		this._super.apply(this, arguments);
		//this.rpl = rpl;
		this.mo = this.map_parent.mo;
		this.nestings_opts = {
			auth: this.app.lfm_auth,
			pmd: this
		};
		
	},
	
	searchf: function() {
		var query = this.q;
		var _this = this;
		['section-vk-users', 'section-lfm-friends', 'section-lfm-user'].forEach(function(el) {
			var section = _this.g(el);
			if (!section) {
				return;
			}
			section.setActive();
			section.searchByQuery(query);
		});
	}
});


var SongActSharing = function(){};
comd.BaseCRow.extendTo(SongActSharing, {
	init: function(){

		
		
		this._super.apply(this, arguments);
		this.actionsrow = this.map_parent;
		this.mo = this.map_parent.map_parent;

		this.wch(this.mo, 'url_part', this.hndUpdateShareURL);



		this.search('');

		//this.share_url = this.mo.getShareUrl();
		
	},
	'nest-searcher': [StrusersRowSearch],
	hndUpdateShareURL: function() {
		this.updateState('share_url', this.mo.getShareUrl());
	},

	search: function(q) {
		this.updateState('query', q);
		var searcher = this.getNesting('searcher');
		if (searcher) {
			searcher.changeQuery(q);
		}
	},
	model_name: 'row-share'
});



return SongActSharing;
});