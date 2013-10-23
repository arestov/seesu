define(['provoda', 'spv', 'app_serv', './invstg', './comd', 'js/LfmAuth'],
function(provoda, spv, app_serv,  invstg, comd, LfmAuth) {
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





var StrusersRSSection = function() {};
invstg.SearchSection.extendTo(StrusersRSSection, {
	resItem: struserSuggest,
	model_name: "section-vk-users",
	init: function(opts) {
		this._super(opts);
		this.mo = this.map_parent.mo;
		this.rpl = this.map_parent.map_parent;
		var _this = this;
		if (app_env.vkontakte || this.app.vk_api){
			this.updateState("can_post_to_own_wall", true);
		} else {
			this.app.on("vk-api", function() {
				_this.updateState("can_post_to_own_wall", true);
			});
		}
		if (!app_env.vkontakte){
			if (this.app.vk_api){
				this.updateState("can_search_friends", true);
				this.removeVKAudioAuth();
			} else {
				this.addVKAudioAuth();
				
				this.app.on("vk-api", function() {
					_this.removeVKAudioAuth();
					_this.updateState("can_search_friends", true);
				});
			}
		} else {
			this.checkVKFriendsAccess(this.app._url.api_settings);

			var binded;
			var bindFriendsAccessChange = function() {
				if (!binded && window.VK){
					binded = true;
					this.app.vk_auth.on('settings-change', function(vk_opts) {
						_this.checkVKFriendsAccess(vk_opts);
					});
				}
			};
			bindFriendsAccessChange();
			if (!binded){
				this.app.once("vk-site-api", bindFriendsAccessChange);
			}
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
	checkVKFriendsAccess: function(vk_opts) {
		var can = (vk_opts & 2) * 1;
		this.updateState("can_search_friends", can);
		if (!can){
			this.addVKAudioAuth(true);
		} else {
			this.removeVKAudioAuth();
		}
	},
	addVKAudioAuth: function(improve) {

		
		if (!this.vk_auth_rqb){
			
			this.vk_auth_rqb = new comd.VkLoginB();
			this.vk_auth_rqb.init({
				auth: this.app.vk_auth
			}, {
				open_opts: {settings_bits: 2},
				desc: improve ? localize('to-find-vk-friends') : localize("to-post-and-find-vk")
			});
			this.updateNesting('vk_auth', this.vk_auth_rqb);

		}
		//to find you friends


		this.updateState("needs_vk_auth", true);

	},
	postToVKWall: function() {
		this.mo.postToVKWall();
	},
	removeVKAudioAuth: function() {
		if (this.vk_auth_rqb){
			this.vk_auth_rqb.die();
			delete this.vk_auth_rqb;

		}
		this.updateState("needs_vk_auth", false);

	},

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
	init: function(opts) {
		this._super(opts);
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

		var row_part = this.map_parent.map_parent;

		this.wch(this.app, 'lfm_userid');
		this.wch(row_part, 'active_view');

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
		depends_on: ['active_view', 'lfm_userid'],
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
	init: function(opts) {
		this._super(opts);
		this.mo = this.map_parent.mo;
		this.rpl = this.map_parent.map_parent;

		var row_part = this.map_parent.map_parent;
		this.wch(this.app, 'lfm_userid');
		this.wch(row_part, 'active_view');

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
		depends_on: ['active_view', 'lfm_userid'],
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



var StrusersRowSearch = function(rpl, mo) {
	this.init(rpl, mo);
};
invstg.Investigation.extendTo(StrusersRowSearch, {
	skip_map_init: true,
	init: function(opts, mo) {
		this._super();
		//this.rpl = rpl;
		this.app = opts.app;
		this.map_parent = opts.map_parent;
		this.mo = mo;

		this.addSection('users', StrusersRSSection);
		this.addSection('friends', LFMFriendsSection);
		this.addSection('one-user', LFMOneUserSection);

		var lfm_auth = new LfmAuth.LfmLogin();
		lfm_auth.init({
				auth: this.app.lfm_auth,
				pmd: this
			}, {
				desc: localize('lastfm-sharing-access')
			});

		this.updateNesting('lfm_auth', lfm_auth);
		
	},
	
	searchf: function() {
		var query = this.q;
		var _this = this;
		['users', 'friends', 'one-user'].forEach(function(el) {
			var section = _this.g(el);
			section.setActive();
			section.searchByQuery(query);
		});
	}
});


var SongActSharing = function(actionsrow, mo){
	this.init(actionsrow, mo);
};
comd.BaseCRow.extendTo(SongActSharing, {
	init: function(actionsrow, mo){

		
		
		this.actionsrow = actionsrow;
		this.app = mo.app;
		this.mo = mo;
		this._super();

		this.wch(this.mo, 'url_part', this.hndUpdateShareURL);

		

		
		this.searcher = new StrusersRowSearch({
			app: this.app,
			map_parent: this
		}, mo);


		
		this.updateNesting('searcher', this.searcher);


		this.search('');

		//this.share_url = this.mo.getShareUrl();
		
	},
	hndUpdateShareURL: function() {
		this.updateState('share_url', this.mo.getShareUrl());
	},

	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
	},
	model_name: 'row-share'
});



return SongActSharing;
});