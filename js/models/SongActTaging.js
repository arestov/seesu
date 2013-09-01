define(['js/LfmAuth', 'app_serv', './comd', 'spv'], function(LfmAuth, app_serv, comd, spv) {
"use strict";
var localize = app_serv.localize;

var LfmTagSong = function(){};
LfmAuth.LfmLogin.extendTo(LfmTagSong, {
	init: function(opts, mo) {
		this._super(opts);
		this.mo = mo;
		this.app = mo.app;

		this.setRequestDesc(localize('lastfm-tagging-access'));
		this.updateState('active', true);

		var _this = this;
		this.updateState('userid', false);
		this.app.on('state-change.lfm_userid', function(e) {
			_this.updateState('userid', e.value);
		});


		opts.pmd.on('state-change.active_view', function(e) {
			_this.updateState('viewing', e.value);
		});


		this.on('state-change.user_tags_string', function(e) {
			var array = (e.value && e.value.trim().split(this.comma_regx)) || [];
			this.updateState('possible_tags', array);
		});
		this.app.getArtcard(this.mo.state('artist')).getTagsModel().on('state-change.data-list', function(e) {
			//console.log(e);
			_this.updateState('artist_tags',e.value);
			
		});

	},
	comma_regx: /\s*\,\s*/,
	comma_regx_end: /\s*\,\s*$/,
	addTag: function(tag_name) {
		var current_tags = this.state('possible_tags');
		if (!current_tags || current_tags.indexOf(tag_name) == -1){

			var full_string = (this.state('user_tags_string') || '');
			if (current_tags && current_tags.length){
				full_string += ', ';
			}
			full_string += tag_name;

			this.updateState('user_tags_string', full_string);
		}
		
		//console.log(tag_name);
	},
	changeTags: function(string) {
		this.updateState('user_tags_string', string);
	},
	'stch-viewing': function(state) {
		if (state){
			this.loaDDD('toptags');
		}
	},
	requests_desc: {
		toptags: {
			before: function() {
				this.updateState('loading_toptags', true);
			},
			after: function() {
				this.updateState('loading_toptags', false);
			},
			send: function(opts) {
				var _this = this;
				return this.app.lfm.get('track.getTopTags', {
					'artist': this.mo.state('artist'),
					'track': this.mo.state('track')
				}, {nocache: opts.has_error})
					.done(function(r){
						var array = spv.toRealArray(spv.getTargetField(r, 'toptags.tag'));
						_this.updateState('toptags', array);
					});
			},
			errors: ['error']
		},
		personal_tags:{

		}
	},
	'compx-has_no_access': function(userid) {
		return !userid;
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
		this.app = mo.app;
		this.lfm_tagsong = new LfmTagSong();
		this.lfm_tagsong.init({auth: this.app.lfm_auth, pmd: this}, this.mo);
		this.updateNesting('lfm_tagsong', this.lfm_tagsong);
		this.lfm_tagsong.on('tagged-success', function() {
			_this.hide();
		});
		
	},
	model_name: 'row-tag'
});
return SongActTaging;

});