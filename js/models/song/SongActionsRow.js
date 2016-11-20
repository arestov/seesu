define(['pv', 'spv', 'app_serv', '../comd', 'js/LfmAuth',
'./SongActPlaylisting', './SongActTaging', './SongActSharing'], function(pv, spv, app_serv, comd, LfmAuth,
SongActPlaylisting, SongActTaging, SongActSharing){
"use strict";

var pvUpdate = pv.update;

var LfmLoveIt = spv.inh(LfmAuth.LfmLogin, {
	init: function(target) {
		target.song = target.map_parent.mo;
	}
}, {
	'compx-access_desc': [['#locales.lastfm-loveit-access']],
	beforeRequest: function() {
		this.bindAuthCallback();
	},
	act: function () {
		this.makeLove();
	},
	bindAuthCallback: function(){
		pvUpdate(this.app, 'lfm_auth_request', this);
	},
	makeLove: function() {

		if (this.app.lfm.sk){
			var _this = this;
			pv.update(this, 'wait_love_done', true);
			this.app.lfm.post('Track.love', {
				sk: this.app.lfm.sk,
				artist: this.song.state('artist'),
				track: this.song.state('track')
			}).then(anyway, anyway);

			function anyway(){
				pv.update(_this, 'wait_love_done', false);
				_this.trigger('love-success');
			}

			this.app.trackEvent('song actions', 'love');
		}


	}
});
var LoveRow = spv.inh(comd.BaseCRow, {
	init: function(target){
		target.mo = target.map_parent.map_parent;

		var old_lit = null;
		var hide_on_love = function() {
			target.hide();
		};
		target.on('child_change-lfm_loveit', function(e) {
			if (old_lit) {
				old_lit.off('love-success', hide_on_love);
			}

			if (e.value) {
				e.value.on('love-success', hide_on_love);
			}
			old_lit = e.value;
		});

	}
}, {
	actionsrow_src: '^',
	'nest-lfm_loveit': [LfmLoveIt, {
		idle_until: 'active_view'
	}],//ver important to not init this each song selected
	model_name: 'row-love'
});

var ScrobbleRow = spv.inh(comd.BaseCRow, {}, {
	actionsrow_src: '^',
	'nest-lfm_scrobble': [LfmAuth.LfmScrobble],
	model_name: 'row-lastfm'
});

var ShuffleListRow = spv.inh(comd.BaseCRow, {}, {
	actionsrow_src: '^',
	'compx-pl_shuffle': [['#settings-pl-shuffle']],
	model_name: 'row-pl-shuffle',
	switchSetting: function(state) {
		this.app.setSetting('pl-shuffle', state);
	}
});

var RepeatSongRow = spv.inh(comd.BaseCRow, {}, {
	actionsrow_src: '^',
	'compx-rept_song': [['#settings-rept-song']],
	model_name: 'row-repeat-song',
	switchSetting: function(state) {
		this.app.setSetting('rept-song', state);
	}
});

var constrs = [ScrobbleRow, RepeatSongRow, ShuffleListRow, SongActPlaylisting, SongActSharing, LoveRow, SongActTaging];

var parts_storage = {};
constrs.forEach(function(el) {
	parts_storage[el.prototype.model_name] = el;
});

var constrs_names= constrs.map(function(el) {
	return el.prototype.model_name;
});


var SongActionsRow = spv.inh(comd.PartsSwitcher, {
	init: function(target) {
		target.mo = target.map_parent;
		pv.update(target, 'active_part', false);
		//target.app = mo.app;
		target.inited_parts = {};
	}
}, {
	sub_page: parts_storage,
	'nest_posb-context_parts': constrs_names,
	'compx-parent_show': [['^mp_show']],
	'stch-parent_show': function (target, state) {
		if (!state) {
			target.hideAll();
		}
	},
	'compx-volume': [['#settings-volume'], function (fac) {
		return fac && fac[0]/fac[1];
	}],
	sendVolume: function(vol) {
		this.app.setSetting('volume', vol);
	},
	setVolume: function(fac) {
		if (!fac){
			return;
		}
		this.sendVolume(fac);
		this.map_parent.setVolume(fac);

	}
});

return SongActionsRow;
});
