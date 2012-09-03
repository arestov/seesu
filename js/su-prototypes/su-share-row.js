var ShareRow;
(function(){
"use strict";


var struserSuggestView = function() {};
var struserSuggest = function(wrap) {
	var user = wrap.user;

	this.init();
	this.mo = wrap.mo;
	this.row = wrap.row;
	this.user_id = user.uid;
	this.photo = user.photo;
	this.online = this.online;
	//this.name = user.name;
	this.text_title = user.first_name + " " + user.last_name;
};
baseSuggest.extendTo(struserSuggest, {
	valueOf: function(){
		return this.user_id;
	},
	onView: function(){
		//this.pl.add(this.mo);
		//this.rpl.hide();
		//su.views.showStaticPlaylist(this.pl, true);
		this.mo.postToVKWall(this.user_id);
		this.row.hide();
	},
	ui_constr: struserSuggestView
});
baseSuggestUI.extendTo(struserSuggestView, {
	createItem: function() {
		var that = this.md;
		this.a = $('<a></a>')
			.text(that.text_title)
			.appendTo(this.c);
		$('<img />').attr("src", that.photo).prependTo(this.a);
		this.c.addClass('share-user-suggest');
		return this;
	}
});

var StrusersRSSection = function() {
	this.init();
};
searchSection.extendTo(StrusersRSSection, {
	resItem: struserSuggest,
	ui_constr: searchSectionUI
});


var StrusersRowSearch = function(rpl, mo) {
	this.init(rpl, mo);
};
investigation.extendTo(StrusersRowSearch, {
	init: function(rpl, mo) {
		this._super();
		this.rpl = rpl;
		this.mo = mo;
		this.addSection('users', new StrusersRSSection());
	},
	ui_constr: investigationUI,
	handleVKFriendsSearch: function(list){
		var r = (this.q ? searchInArray(list, this.q, ["first_name", "last_name"]) : list);
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

		su
			.once("vk-friends.share-row", function(list){
				_this.handleVKFriendsSearch(list);
			}, {exlusive: true})
			.getVKFriends();
	}
});





var ShareRowUI = function(){};
BaseCRowUI.extendTo(ShareRowUI, {
	init: function(md, parent_c, buttons_panel){
		this.md = md;
		this._super();
		this.c = parent_c.children('.share-song');
		this.button = buttons_panel.find('.pc-place .pc-rupor');
		
		this.users_c = $('<div class="users-list"></div>').appendTo(this.c);

		$("<h3></h3>").text(localize('post-song')).appendTo(this.users_c);



		this.bindClick();
		this.setModel(md);
	},
	'stch-share-url': {
		fn: function(state){
			this.getPart("share_input").val(state || "")
		//	dep_vp
		},
		dep_vp: ['share_input']
	},
	'stch-can-post-to-own-wall':{
		fn: function(state){
			this.requirePart("own-wall-button");
		},
		dep_vp: ['pch-ws-own']
	},
	'stch-own-photo': {
		fn: function(state) {
			if (state){
				if (this.own_photo){
					this.own_photo.remove();
				}
				this.own_photo = $("<img />").attr("src", state).prependTo(this.getPart("own-wall-button"));
			}
		},
		dep_vp: ["own-wall-button"]
	},
	'stch-can-search-friends': {
		fn: function(state){
			if (state){
				var _this = this;
				var oldv;
				var inputSearch = debounce(function(e) {
					var newval = this.value;
					if (oldv !== newval){
						_this.md.search(newval);
						oldv = newval;
					}
					
				}, 100);

				var input_place = $("<div class='list-search-input-place'></div>").insertBefore(this.getPart("pch-ws-input"));

				this.input = $("<input type='text'/>").appendTo(input_place)
					.bind('keyup change search mousemove', inputSearch);

				$("<div class='friends-search-desc desc'></div>")
					.text(localize("or-wall-of-f"))
					.insertBefore(this.getPart("pch-ws-friends"));

				this.getPart("pch-ws-friends").after();
				var searcher_ui = this.md.searcher.getFreeView();
				if (searcher_ui){
					this.addChild(searcher_ui);
					searcher_ui.getC().insertBefore(this.getPart("pch-ws-friends"));
					searcher_ui.expand();
					searcher_ui.appended();
				}

				this.md.search("");
			}
			
		},
		dep_vp: ['pch-ws-input', "pch-ws-friends"]
	},
	'stch-needs-vk-auth': {
		fn: function(state) {
			if (state){
				var auth_ui = this.md.vk_auth.getFreeView();
				if (auth_ui){
					this.addChild(auth_ui);
					auth_ui.getC().insertBefore(this.getPart("pch-vk-auth"));
				}
			}
		},
		dep_vp: ["pch-vk-auth"]
	},
	parts_builder: {
		share_input: function(){
			var share_input = this.c.find('.song-link');
			share_input.bind("click focus", function() {
				this.select();
			});
			return share_input;
		},
		"own-wall-button": function() {
			var _this = this;
			return $("<div class='post-to-my-vk-wall'></div>").click(function(){
				_this.md.mo.postToVKWall();
			}).text(localize("to-own-wall")).insertBefore(this.getPart("pch-ws-own"));
		},
		"pch-vk-auth": function() {
			return this.addWSChunk();
		},
		"pch-ws-own": function(){
			return this.addWSChunk();
		},
		"pch-ws-input": function(){
			return this.addWSChunk();
		},
		"pch-ws-friends": function(){
			return this.addWSChunk();
		}
	},
	addWSChunk: function() {
		return $(document.createTextNode("")).appendTo(this.users_c);
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		var _this = this;

		this.requirePart("share_input");
		
		/*
		this.share_input = this.c.find('.song-link').val();
		this.share_input.bind("click focus", function() {
			this.select();
		});
*/		
		this.requirePart("pch-ws-input");
		this.requirePart("pch-ws-own");
		this.requirePart("pch-vk-auth");
		this.requirePart("pch-ws-friends");
		

		
	}
});

ShareRow = function(actionsrow, mo){
	this.init(actionsrow, mo);
};
BaseCRow.extendTo(ShareRow, {
	init: function(actionsrow, mo){
		var _this = this;
		this.actionsrow = actionsrow;
		this.mo = mo;
		this._super();
		if (app_env.vkontakte || su.vk_api){
			this.updateState("can-post-to-own-wall", true);
		} else {
			su.on("vk-api", function() {
				_this.updateState("can-post-to-own-wall", true);
			});
		}
		if (!app_env.vkontakte){
			if (su.vk_api){
				this.updateState("can-search-friends", true);
				this.removeVKAudioAuth();
			} else {
				this.addVKAudioAuth();
				
				su.on("vk-api", function() {
					_this.removeVKAudioAuth();
					_this.updateState("can-search-friends", true);
				});
			}
		} else {
			this.checkVKFriendsAccess(su._url.api_settings);

			var binded;
			var bindFriendsAccessChange = function() {
				if (!binded && window.VK){
					binded = true;
					window.VK.addCallback('onSettingsChanged', function(vk_opts) {
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
		this.addChild(this.searcher);

		var updateSongURL = function(){
			_this.updateState('share-url', _this.mo.getShareUrl());
		};
		updateSongURL();

		this.mo.on("url-change", function(){
			updateSongURL();
		});

		
		var cu_info = su.s.getInfo('vk');
		if (cu_info){
			if (cu_info.photo){
				this.updateState("own-photo", cu_info.photo);
			}
		} else {
			su.s.once("info-change.vk", function(cu_info) {
				if (cu_info.photo){
					_this.updateState("own-photo", cu_info.photo);
				}
			});
		}

		//this.share_url = this.mo.getShareUrl();
		
	},
	checkVKFriendsAccess: function(vk_opts) {
		var can = (vk_opts & 2) * 1;
		this.updateState("can-search-friends", can);
		if (!can){
			this.addVKAudioAuth(true);
		} else {
			this.removeVKAudioAuth();
		}
	},
	addVKAudioAuth: function(improve) {
		if (!this.vk_auth){

			this.vk_auth = new vkLogin();
			this.vk_auth.on('auth-request', function() {
				if (su.vk_app_mode){
					if (window.VK){
						VK.callMethod('showSettingsBox', 2);
					}
				} else {
					su.vk_auth.requestAuth();
				}
				//console.log()
			});
			this.addChild(this.vk_auth);

		}
		//to find you friends

		this.vk_auth.setRequestDesc(improve ? localize('to-find-vk-friends') : localize("to-post-and-find-vk"));

		this.updateState("needs-vk-auth", true);

	},
	removeVKAudioAuth: function() {
		if (this.vk_auth){
			this.vk_auth.die();
			delete this.vk_auth;

		}
		this.updateState("needs-vk-auth", false);

	},
	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
	},
	row_name: 'share',
	ui_constr: ShareRowUI
});
})()


