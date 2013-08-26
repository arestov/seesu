define(['js/LfmAuth', 'app_serv', './comd'], function(LfmAuth, app_serv, comd) {
"use strict";
var localize = app_serv.localize;

var LfmTagSong = function(){};
LfmAuth.LfmLogin.extendTo(LfmTagSong, {
	init: function(opts, mo) {
		this._super(opts);
		this.song = mo;
		this.app = mo.app;
		this.setRequestDesc(localize('lastfm-tagging-access'));
		this.updateState('active', true);
	}
	//_this.trigger('tagged-success');
});


var SongActTaging = function(actionsrow, mo){
	this.init(actionsrow, mo);
};
comd.BaseCRow.extendTo(SongActTaging, {
	init: function(actionsrow, mo){
		var _this = this;
		this.actionsrow = actionsrow;
		this.mo = mo;
		this._super();
		this.lfm_tagsong = new LfmTagSong();
		this.lfm_tagsong.init({auth: su.lfm_auth, pmd: this}, this.mo);
		this.updateNesting('lfm_tagsong', this.lfm_tagsong);
		this.lfm_tagsong.on('tagged-success', function() {
			_this.hide();
		});
		
	},
	model_name: 'row-tag'
});
return SongActTaging;

});