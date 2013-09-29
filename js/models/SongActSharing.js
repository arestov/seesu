define(['provoda', 'spv', 'app_serv', './invstg', './comd'], function(provoda, spv, app_serv,  invstg, comd) {
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


var StrusersRSSection = function() {
	this.init();
};
invstg.SearchSection.extendTo(StrusersRSSection, {
	resItem: struserSuggest,
	model_name: "section-vk-users"
});


var StrusersRowSearch = function(rpl, mo) {
	this.init(rpl, mo);
};
invstg.Investigation.extendTo(StrusersRowSearch, {
	skip_map_init: true,
	init: function(rpl, mo) {
		this._super();
		this.rpl = rpl;
		this.mo = mo;
		this.app = mo.app;
		this.addSection('users', new StrusersRSSection());
	},
	handleVKFriendsSearch: function(list){
		var r = (this.q ? spv.searchInArray(list, this.q, ["first_name", "last_name"]) : list);
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

		this.g('users').appendResults(r, true);
	},
	searchf: function() {
		var
			_this = this,
			pl_sec = this.g('users');

		pl_sec.setActive();
		pl_sec.changeQuery(this.q);

		this.app
			.once("vk-friends.share-row", function(list){
				_this.handleVKFriendsSearch(list);
			}, {exlusive: true})
			.getVKFriends();
	}
});



//su.routePathByModels('/users/me/lfm:neighbours')
//preloadStart
var VKSongSharing = function() {};
invstg.Investigation.extendTo(VKSongSharing, {

});

var LfmSongSharing = function() {};
invstg.Investigation.extendTo(VKSongSharing, {
	init: function(opts, actionsrow, mo) {
		this._super();
		this.app = opts.app;
		this.map_parent = opts.map_parent;

		this.mo = mo;
		this.actionsrow = actionsrow;

		this.lfm_friends = this.app.routePathByModels('/users/me/lfm:friends');
		this.wch(this.map_parent, 'active_view');
		this.wch(this, 'active_view', function(e) {
			if (e.value){
				this.lfm_friends.preloadStart();
			}
		});

		//this.lfm_friends.on('child-change.')
	}
});


var SongActSharing = function(actionsrow, mo){
	this.init(actionsrow, mo);
};
comd.BaseCRow.extendTo(SongActSharing, {
	init: function(actionsrow, mo){

		var su = window.su;
		
		var _this = this;
		this.actionsrow = actionsrow;
		this.app = mo.app;
		this.mo = mo;
		this._super();

		this.wch(this.mo, 'url_part', this.hndUpdateShareURL);

		

		if (app_env.vkontakte || su.vk_api){
			this.updateState("can_post_to_own_wall", true);
		} else {
			su.on("vk-api", function() {
				_this.updateState("can_post_to_own_wall", true);
			});
		}
		if (!app_env.vkontakte){
			if (su.vk_api){
				this.updateState("can_search_friends", true);
				this.removeVKAudioAuth();
			} else {
				this.addVKAudioAuth();
				
				su.on("vk-api", function() {
					_this.removeVKAudioAuth();
					_this.updateState("can_search_friends", true);
				});
			}
		} else {
			this.checkVKFriendsAccess(su._url.api_settings);

			var binded;
			var bindFriendsAccessChange = function() {
				if (!binded && window.VK){
					binded = true;
					su.vk_auth.on('settings-change', function(vk_opts) {
						_this.checkVKFriendsAccess(vk_opts);
					});
				}
			};
			bindFriendsAccessChange();
			if (!binded){
				su.once("vk-site-api", bindFriendsAccessChange);
			}
		}

		this.searcher = new StrusersRowSearch(this, mo);
		this.updateNesting('searcher', this.searcher);
		var lfm_sharing = new LfmSongSharing();
		lfm_sharing.init({
			app: this.app,
			map_parent: this
		}, actionsrow, mo);
		this.updateNesting('lfmsharing', lfm_sharing);

		


		
		var cu_info = su.s.getInfo('vk');
		if (cu_info){
			if (cu_info.photo){
				this.updateState("own_photo", cu_info.photo);
			}
		} else {
			su.s.once("info-change.vk", function(cu_info) {
				if (cu_info.photo){
					_this.updateState("own_photo", cu_info.photo);
				}
			});
		}

		//this.share_url = this.mo.getShareUrl();
		
	},
	hndUpdateShareURL: function() {
		this.updateState('share_url', this.mo.getShareUrl());
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
	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
	},
	model_name: 'row-share'
});



return SongActSharing;
});