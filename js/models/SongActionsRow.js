define(['spv', 'app_serv', './comd', 'js/LfmAuth', './invstg',
'./SongActPlaylisting', './SongActTaging'], function(spv, app_serv, comd, LfmAuth, invstg,
SongActPlaylisting, SongActTaging){
"use strict";
var localize = app_serv.localize;
var app_env = app_serv.app_env;


var LfmLoveIt = function(opts, mo) {
	this.init(opts, mo);
};

LfmAuth.LfmLogin.extendTo(LfmLoveIt, {
	init: function(opts, mo) {
		this._super(opts);
		this.song = mo;
		this.app = mo.app;
		this.setRequestDesc(localize('lastfm-loveit-access'));
		this.updateState('active', true);
	},
	beforeRequest: function() {
		this.bindAuthCallback();
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			_this.makeLove();
		}, {exlusive: true});
	},
	makeLove: function() {

		if (this.app.lfm.sk){
			var _this = this;
			this.updateState('wait_love_done', true);
			this.app.lfm.post('Track.love', {
				sk: this.app.lfm.sk,
				artist: this.song.artist,
				track: this.song.track
			})
				.always(function(){
					_this.updateState('wait_love_done', false);
					_this.trigger('love-success');
				});
			seesu.trackEvent('song actions', 'love');
		}
		
		
	}
});
var LoveRow = function(actionsrow, mo){
	this.init(actionsrow, mo);
};
comd.BaseCRow.extendTo(LoveRow, {
	init: function(actionsrow, mo){
		var _this = this;
		this.actionsrow = actionsrow;
		this.mo = mo;
		this._super();
		this.lfm_loveit = new LfmLoveIt({auth: su.lfm_auth, pmd: this}, this.mo);
		this.updateNesting('lfm_loveit', this.lfm_loveit);
		this.lfm_loveit.on('love-success', function() {
			_this.hide();
		});
		
	},
	model_name: 'row-love'
});







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

		su
			.once("vk-friends.share-row", function(list){
				_this.handleVKFriendsSearch(list);
			}, {exlusive: true})
			.getVKFriends();
	}
});




var ShareRow = function(actionsrow, mo){
	this.init(actionsrow, mo);
};
comd.BaseCRow.extendTo(ShareRow, {
	init: function(actionsrow, mo){

		var su = window.su;
		
		var _this = this;
		this.actionsrow = actionsrow;
		this.mo = mo;
		this._super();
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


		this.wch(this.mo, 'url_part', this.hndUpdateShareURL);


		
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
				auth: su.vk_auth
			}, {
				open_opts: {settings_bits: 2},
				desc: improve ? localize('to-find-vk-friends') : localize("to-post-and-find-vk")
			});
			this.updateNesting('vk_auth', this.vk_auth_rqb);

		}
		//to find you friends


		this.updateState("needs_vk_auth ", true);

	},
	postToVKWall: function() {
		this.mo.postToVKWall();
	},
	removeVKAudioAuth: function() {
		if (this.vk_auth_rqb){
			this.vk_auth_rqb.die();
			delete this.vk_auth_rqb;

		}
		this.updateState("needs_vk_auth ", false);

	},
	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
	},
	model_name: 'row-share'
});







var ScrobbleRow = function(actionsrow){
	this.init(actionsrow);
};
comd.BaseCRow.extendTo(ScrobbleRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();
		this.lfm_scrobble = new LfmAuth.LfmScrobble({auth: su.lfm_auth, pmd: this});
		this.updateNesting('lfm_scrobble', this.lfm_scrobble);
	},
	model_name: 'row-lastfm'
});









var RepeatSongRow = function(actionsrow){
	this.init(actionsrow);
};
comd.BaseCRow.extendTo(RepeatSongRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();

		var _this = this;

		var doNotReptPl = function(state) {
			_this.updateState('rept-song', state);
			actionsrow.mo.updateState('rept-song', state);
		};
		if (su.settings['rept-song']){
			doNotReptPl(true);
		}
		su.on('settings.rept-song', doNotReptPl);


	},
	setDnRp: function(state) {
		this.updateState('rept-song', state);
		su.setSetting('rept-song', state);
	},
	model_name: 'row-repeat-song'
});





var SongActionsRow = function(mo) {
	this.init(mo);
};
comd.PartsSwitcher.extendTo(SongActionsRow, {
	init: function(mo) {
		this._super();
		this.mo = mo;
		this.updateState('active_part', false);
		this.app = mo.app;

		this.nextTick(this.initHeavyPart);
	},
	initHeavyPart: function() {
		this.addPart(new ScrobbleRow(this, this.mo));
		this.addPart(new RepeatSongRow(this, this.mo));
		this.addPart(new SongActPlaylisting(this, this.mo));
		this.addPart(new ShareRow(this, this.mo));
		this.addPart(new LoveRow(this, this.mo));
		this.addPart(new SongActTaging(this, this.mo));

		if (this.app.settings['volume']){
			this.setVolumeState(this.app.settings['volume']);
		}
		this.app.on('settings.volume', this.setVolumeState, this.getContextOpts());
	},
	setVolumeState: function(fac) {
		this.updateState('volume', fac[0]/fac[1]);
	},
	sendVolume: function(vol) {
		this.app.setSetting('volume', vol);
	},
	setVolume: function(fac) {
		this.updateState('volume', fac[0]/fac[1]);
		this.sendVolume(fac);
		
	}
});

return SongActionsRow;
});