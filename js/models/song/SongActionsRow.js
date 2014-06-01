define(['provoda', 'spv', 'app_serv', '../comd', 'js/LfmAuth',
'./SongActPlaylisting', './SongActTaging', './SongActSharing'], function(provoda, spv, app_serv, comd, LfmAuth,
SongActPlaylisting, SongActTaging, SongActSharing){
"use strict";
var localize = app_serv.localize;



var LfmLoveIt = function(opts, mo) {
	this.init(opts, mo);
};

LfmAuth.LfmLogin.extendTo(LfmLoveIt, {
	init: function(opts, mo) {
		this._super.apply(this, arguments);
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





var ShuffleListRow = function(actionsrow) {
	this.init(actionsrow);
};
comd.BaseCRow.extendTo(ShuffleListRow, {
	model_name: 'row-pl-shuffle',
	init: function(actionsrow) {
		this.actionsrow = actionsrow;
		this._super();

		this.wch(su, 'settings-pl-shuffle', function(e) {
			this.updateState('pl_shuffle', e.value);
			this.actionsrow.mo.updateState('pl-shuffle', e.value);
		});
	},
	switchSetting: function(state) {
		this.updateState('pl_shuffle', state);
		su.setSetting('pl-shuffle', state);
	}


});



var RepeatSongRow = function(actionsrow){
	this.init(actionsrow);
};
comd.BaseCRow.extendTo(RepeatSongRow, {
	model_name: 'row-repeat-song',
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();

		this.wch(su, 'settings-rept-song', function(e) {
			this.updateState('rept_song', e.value);
			this.actionsrow.mo.updateState('rept-song', e.value);
		});


	},
	switchSetting: function(state) {
		this.updateState('rept_song', state);
		su.setSetting('rept-song', state);
	}
	
});

var parts_storage = {};
[ScrobbleRow, RepeatSongRow, ShuffleListRow, SongActPlaylisting, SongActSharing, LoveRow, SongActTaging].forEach(function(el) {
	parts_storage[el.prototype.model_name] = el;
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
		this.inited_parts = {};

		this.nextTick(this.initHeavyPart);

		this.wch(this.mo, 'mp_show', this.hndSongHide);
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
	switchPart: function(name) {
		this.initPart(name);
		//this.realyHeavyPart();
		this._super(name);
	},
	initPart: function(name) {
		if (name){
			if (!this.inited_parts[name]){
				var part = new parts_storage[name](this, this.mo);
				this.inited_parts[name] = true;
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