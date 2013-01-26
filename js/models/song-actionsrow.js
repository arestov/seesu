var LoveRow;
(function(){
"use strict";




var LfmLoveIt = function(opts, mo) {
	this.init(opts, mo);
};

LfmLogin.extendTo(LfmLoveIt, {
	init: function(opts, mo) {
		this._super(opts);
		this.song = mo;
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

		if (lfm.sk){
			var _this = this;
			this.updateState('wait-love-done', true);
			lfm.post('Track.love', {
				sk: lfm.sk,
				artist: this.song.artist,
				track: this.song.track
			})
				.always(function(){
					_this.updateState('wait-love-done', false);
					_this.trigger('love-success');
				})
			seesu.trackEvent('song actions', 'love');
		}
		
		
	}
});
LoveRow = function(actionsrow, mo){
	this.init(actionsrow, mo);
};
BaseCRow.extendTo(LoveRow, {
	init: function(actionsrow, mo){
		var _this = this;
		this.actionsrow = actionsrow;
		this.mo = mo;
		this._super();
		this.lfm_loveit = new LfmLoveIt({auth: su.lfm_auth, pmd: this}, this.mo);
		this.setChild('lfm_loveit', this.lfm_loveit);
		this.lfm_loveit.on('love-success', function() {
			_this.hide();
		});
		this.addChild(this.lfm_loveit);
		
	},
	model_name: 'row-love'
});
})()


var ShareRow;
(function(){
"use strict";


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
		this.mo.postToVKWall(this.user_id);
		this.row.hide();
	}
});


var StrusersRSSection = function() {
	this.init();
};
searchSection.extendTo(StrusersRSSection, {
	resItem: struserSuggest,
	model_name: "section-vk-users"
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




ShareRow = function(actionsrow, mo){
	this.init(actionsrow, mo);
};
BaseCRow.extendTo(ShareRow, {
	init: function(actionsrow, mo){

		var su = window.su;
		
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
		this.setChild('searcher', this.searcher);
		this.addChild(this.searcher);

		var updateSongURL = function(){
			_this.updateState('share-url', _this.mo.getShareUrl());
		};

		this.mo.on("state-change.url-part", function(){
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

		
		if (!this.vk_auth_rqb){
			
			this.vk_auth_rqb = new VkLoginB();
			this.vk_auth_rqb.init({
				auth: su.vk_auth
			}, {
				open_opts: {settings_bits: 2},
				desc: improve ? localize('to-find-vk-friends') : localize("to-post-and-find-vk")
			});
			this.setChild('vk_auth', this.vk_auth_rqb);
			this.addChild(this.vk_auth_rqb);

		}
		//to find you friends


		this.updateState("needs-vk-auth", true);

	},
	removeVKAudioAuth: function() {
		if (this.vk_auth_rqb){
			this.vk_auth_rqb.die();
			delete this.vk_auth_rqb;

		}
		this.updateState("needs-vk-auth", false);

	},
	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
	},
	model_name: 'row-share'
//	ui_constr: ShareRowUI
});
})()


var PlaylistAddRow;
(function() {
"use strict";
var playlistSuggest = function(data){
	this.init();
	this.pl = data.playlist;
	this.mo = data.mo;
	this.rpl = data.rpl;
	this.text_title = this.getTitle();
};
baseSuggest.extendTo(playlistSuggest, {
	valueOf: function(){
		return this.pl.playlist_title;
	},
	onView: function(){
		this.pl.add(this.mo);
		this.rpl.hide();
	}
//	ui_constr: baseSuggestUI
});


var PlaylistRSSection = function() {
	this.init();
};
searchSection.extendTo(PlaylistRSSection, {
	resItem: playlistSuggest,
	model_name: "section-playlist"
});


var PlaylistRowSearch = function(rpl, mo) {
	this.init(rpl, mo);
};
investigation.extendTo(PlaylistRowSearch, {
	init: function(rpl, mo) {
		this._super();
		this.rpl = rpl;
		this.mo = mo;
		this.addSection('playlists', new PlaylistRSSection());
	},
	searchf: function() {
		var
			pl_results = [],
			pl_sec = this.g('playlists');

		pl_sec.setActive();
		pl_sec.changeQuery(this.q);


		var serplr = su.getPlaylists(this.q);
		if (serplr.length){
			for (var i = 0; i < serplr.length; i++) {
				pl_results.push({
					playlist: serplr[i],
					mo: this.mo,
					rpl: this.rpl
				});
			}
		}

		pl_sec.appendResults(pl_results, true, true);
	}
});



PlaylistAddRow = function(actionsrow, mo) {
	this.init(actionsrow, mo);
};
BaseCRow.extendTo(PlaylistAddRow, {
	init: function(actionsrow, mo){
		this.actionsrow = actionsrow;
		this.mo = mo;
		this._super();
		this.searcher = new PlaylistRowSearch(this, mo);
		this.setChild('searcher', this.searcher);
		this.addChild(this.searcher);
	},
	model_name: 'row-playlist-add',
//	ui_constr: PlaylistAddRowUI,
	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
	},
	createPlaylist: function() {
		var current_query = this.state('query');
		if (current_query){
			su.gena.createUserPlaylist(current_query).add(this.mo);
		}
		this.hide();
	}
});
//su.gena.createUserPlaylist(searching_for).add(current_song);
//playlist.add(song);

})();



var ScrobbleRow = function(actionsrow){
	this.init(actionsrow);
};
BaseCRow.extendTo(ScrobbleRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();
		this.lfm_scrobble = new LfmScrobble({auth: su.lfm_auth, pmd: this});
		this.setChild('lfm_scrobble', this.lfm_scrobble);
		this.addChild(this.lfm_scrobble);
	},
	model_name: 'row-lastfm'
});





var FlashErrorRow = function(actionsrow){
	this.init(actionsrow);
};
BaseCRow.extendTo(FlashErrorRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();
	},
	model_name: 'row-flash-error'
});





var RepeatSongRow = function(actionsrow){
	this.init(actionsrow);
};
BaseCRow.extendTo(RepeatSongRow, {
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





var TrackActionsRow = function(mo) {
	this.init(mo);
};
PartsSwitcher.extendTo(TrackActionsRow, {
	init: function(mo) {
		this._super();
		this.mo = mo;
		this.updateState('active_part', false);

		this.addPart(new ScrobbleRow(this, mo));
		this.addPart(new FlashErrorRow(this, mo));
		this.addPart(new RepeatSongRow(this, mo));
		this.addPart(new PlaylistAddRow(this, mo));
		this.addPart(new ShareRow(this, mo));
		this.addPart(new LoveRow(this, mo));

		var _this = this;

		var setVolume = function(fac) {
			_this.updateState('volume', fac[0]/fac[1]);
		};
		if (su.settings['volume']){
			setVolume(su.settings['volume']);
		}
		su.on('settings.volume', setVolume);

		
	},
	sendVolume: function(vol) {
		su.setSetting('volume', vol);
	},
	setVolume: function(fac) {
		this.updateState('volume', fac[0]/fac[1]);
		this.sendVolume(fac);
		
	}
//	ui_constr: TrackActionsRowUI
});
//song.prototype = song_methods;