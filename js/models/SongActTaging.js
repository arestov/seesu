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

		this.updateState('userid', false);
		this.wch(this.app, 'lfm_userid', 'userid');
		this.wch(opts.pmd, 'active_view', 'viewing');
		

		this.wch(this.app.getArtcard(this.mo.state('artist')).getTagsModel(), 'data-list', 'artist_tags');


		this.on('state-change.canload_personal', function(e) {
			if (e.value){
				this.loaDDD('personal_tags');
			}
			
		});



	},
	comma_regx: /\s*\,\s*/,
	comma_regx_end: /\s*\,\s*$/,
	'compx-possible_tags':{
		depends_on: ['user_tags_string'],
		fn: function(user_tags_string) {
			return (user_tags_string && user_tags_string.trim().split(this.comma_regx)) || [];
		}
	},
	'compx-petags': {
		depends_on: ['personal_tags'],
		fn: function(personal_tags) {
			return spv.filter(personal_tags, 'name');
		}
	},
	'compx-tags_toadd': {
		depends_on: ['petags', 'possible_tags'],
		fn: function(petags, possible_tags) {
			return spv.arrayExclude(petags, possible_tags);
		}
	},
	'compx-tags_toremove': {
		depends_on: ['petags', 'possible_tags'],
		fn: function(petags, possible_tags) {
			return spv.arrayExclude(possible_tags, petags);
		}
	},
	'compx-has_changes': {
		depends_on: ['tags_toadd', 'tags_toremove'],
		fn: function(tags_toadd, tags_toremove) {
			return !!((tags_toadd && tags_toadd.length) || (tags_toremove && tags_toremove.length));
		}
	},
	'compx-canload_personal': {
		depends_on: ['userid', 'viewing'],
		fn: spv.hasEveryArgs
	},
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
			before: function() {
				this.updateState('loading_personal_tags', true);
			},
			after: function() {
				this.updateState('loading_personal_tags', false);
			},
			send: function() {
				var _this = this;
				return this.app.lfm.get('track.getTags', {
					'artist': this.mo.state('artist'),
					'track': this.mo.state('track'),
					'user': this.state('userid')
				}, {nocache: true})
					.done(function(r){
						var array = spv.toRealArray(spv.getTargetField(r, 'tags.tag'));
						_this.updateState('personal_tags', array);

						var petags = _this.state('petags');
						if (petags.length && !_this.state('user_tags_string')){
							_this.updateState('user_tags_string', petags.join(', '));
						}
					});
			},
			errors: ['error']
		}
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