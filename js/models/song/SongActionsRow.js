define(['pv', 'spv', 'app_serv', '../comd', 'js/LfmAuth',
'./SongActPlaylisting', './SongActTaging', './SongActSharing'], function(pv, spv, app_serv, comd, LfmAuth,
SongActPlaylisting, SongActTaging, SongActSharing){
"use strict";
var localize = app_serv.localize;



var LfmLoveIt = function() {};

LfmAuth.LfmLogin.extendTo(LfmLoveIt, {
	init: function() {
		this._super.apply(this, arguments);
		this.song = this.map_parent.mo;
		this.updateState('active', true);
	},
	access_desc: localize('lastfm-loveit-access'),
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
			this.app.trackEvent('song actions', 'love');
		}
		
		
	}
});
var LoveRow = function(){};
comd.BaseCRow.extendTo(LoveRow, {
	'nest-lfm_loveit': [LfmLoveIt, false, 'active_view'],//ver important to not init this each song selected
	init: function(){
		var _this = this;
		this._super.apply(this, arguments);
		this.actionsrow = this.map_parent;
		this.mo = this.map_parent.map_parent;
		this.nestings_opts = {
			auth: this.app.lfm_auth,
			pmd: this
		};
		

		var old_lit = null;
		var hide_on_love = function() {
			_this.hide();
		};
		this.on('child_change-lfm_loveit', function(e) {
			if (old_lit) {
				old_lit.off('love-success', hide_on_love);
			}

			if (e.value) {
				e.value.on('love-success', hide_on_love);
			}
			old_lit = e.value;
		});
		
	},
	model_name: 'row-love'
});








var ScrobbleRow = function(){};
comd.BaseCRow.extendTo(ScrobbleRow, {
	'nest-lfm_scrobble': [LfmAuth.LfmScrobble],
	init: function(){
		
		this._super.apply(this, arguments);
		this.nestings_opts = {
			auth: this.app.lfm_auth,
			pmd: this
		};
		this.actionsrow = this.map_parent;
	},
	model_name: 'row-lastfm'
});





var ShuffleListRow = function() {};
comd.BaseCRow.extendTo(ShuffleListRow, {
	model_name: 'row-pl-shuffle',
	init: function() {
		this._super.apply(this, arguments);
		this.actionsrow = this.map_parent;
		

		this.wch(this.app, 'settings-pl-shuffle', function(e) {
			this.updateState('pl_shuffle', e.value);
			this.actionsrow.mo.updateState('pl-shuffle', e.value);
		});
	},
	switchSetting: function(state) {
		this.updateState('pl_shuffle', state);
		su.setSetting('pl-shuffle', state);
	}


});



var RepeatSongRow = function(){};
comd.BaseCRow.extendTo(RepeatSongRow, {
	model_name: 'row-repeat-song',
	init: function(){
		this._super.apply(this, arguments);
		this.actionsrow = this.map_parent;

		this.wch(this.app, 'settings-rept-song', function(e) {
			this.updateState('rept_song', e.value);
			this.actionsrow.mo.updateState('rept-song', e.value);
		});


	},
	switchSetting: function(state) {
		this.updateState('rept_song', state);
		su.setSetting('rept-song', state);
	}
	
});

var constrs = [ScrobbleRow, RepeatSongRow, ShuffleListRow, SongActPlaylisting, SongActSharing, LoveRow, SongActTaging];

var parts_storage = {};
constrs.forEach(function(el) {
	parts_storage[el.prototype.model_name] = el;
});



var SongActionsRow = function() {};
comd.PartsSwitcher.extendTo(SongActionsRow, {
	'nest_posb-context_parts': constrs,
	init: function() {
		this._super.apply(this, arguments);
		this.mo = this.map_parent;
		this.updateState('active_part', false);
		//this.app = mo.app;
		this.inited_parts = {};

		this.nextTick(this.initHeavyPart);

		this.wch(this.map_parent, 'mp_show', this.hndSongHide);
	},
	hndSongHide: function(e) {
		if (!e.value) {
			this.hideAll();
		}
	},
	initHeavyPart: function() {

		this.wch(this.app, 'settings-volume', function(e) {
			if (!e.value) {
				return;
			}
			this.setVolumeState(e.value);
		});
	},
	switchPart: function(part_name) {
		this.initPart(part_name);
		//this.realyHeavyPart();
		this._super(part_name);
	},
	initPart: function(part_name) {
		if (part_name){
			if (!this.inited_parts[part_name]){
				var part = this.initSi(parts_storage[part_name]);
				this.inited_parts[part_name] = true;
				this.addPart(part);
			}
		}
	},
	setVolumeState: function(fac) {
		if (!fac){
			return;
		}
		this.updateState('volume', fac[0]/fac[1]);
	},
	sendVolume: function(vol) {
		this.app.setSetting('volume', vol);
	},
	setVolume: function(fac) {
		if (!fac){
			return;
		}
		this.updateState('volume', fac[0]/fac[1]);
		this.sendVolume(fac);
		
	}
});

return SongActionsRow;
});