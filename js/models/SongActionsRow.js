define(['spv', 'app_serv', './comd', 'js/LfmAuth',
'./SongActPlaylisting', './SongActTaging', './SongActSharing'], function(spv, app_serv, comd, LfmAuth,
SongActPlaylisting, SongActTaging, SongActSharing){
"use strict";
var localize = app_serv.localize;



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
		this.addPart(new SongActSharing(this, this.mo));
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