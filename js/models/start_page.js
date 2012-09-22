var StartPage;
(function() {
"use strict";

StartPage = function() {};

mapLevelModel.extendTo(StartPage, {
	model_name: 'start_page',
	page_name: 'start page',
	showPlaylists: function(){
		su.search(':playlists');
	},
	init: function(su){
		this._super();
		this.su = su;
		this.updateState('nav-title', 'Seesu start page');

		var fast_pagestart = new FastPSRow();
		fast_pagestart.init(this);

		this.setChild('fast_pstart', fast_pagestart);

		this.closed_messages = suStore('closed-messages') || {};
		return this;
	},
	short_title: 'Seesu',
	getTitle: function() {
		return this.short_title;
	},
	messages: {
		"rating-help": function(state){
			if (su.app_pages[su.env.app_type]){
				if (state){
					this.updateState('ask-rating-help', su.app_pages[su.env.app_type]);
				} else {
					this.updateState('ask-rating-help', false);
				}
				
			}
		}
	},
	closeMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.closed_messages[message_name] = true;
			suStore('closed-messages', this.closed_messages, true);
			this.messages[message_name].call(this, false);
		}
	},
	showMessage: function(message_name) {
		if (this.messages[message_name] && !this.closed_messages[message_name]){
			this.messages[message_name].call(this, true);
		}
	}
});

var FastPSRow = function(parent_m){};

PartsSwitcher.extendTo(FastPSRow, {
	init: function(ml) {
		this._super();
		this.ml = ml;
		this.updateState('active_part', false);
		this.addPart(new LastfmRecommRow(this, ml));
		this.addPart(new LastfmLoveRow(this, ml));
	}
});


var LfmReccoms = function(){};
LfmLogin.extendTo(LfmReccoms, {
	init: function(auth, pm){
		this._super(auth);
		this.pm = pm
		this.setRequestDesc(localize('lastfm-reccoms-access'));
		this.updateState('active', true);
	},
	onSession: function(){
		this.updateState('active', false);
	},
	beforeRequest: function() {
		this.bindAuthCallback();
		
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			render_recommendations();
			_this.pm.hide();
		}, {exlusive: true});
	},
	handleUsername: function(username) {
		render_recommendations_by_username(username);
	}
});




var LastfmRecommRow = function(actionsrow){
		this.init(actionsrow);
};
BaseCRow.extendTo(LastfmRecommRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();

		var lfm_reccoms = new LfmReccoms();
		lfm_reccoms.init(this.actionsrow.ml.su.lfm_auth, this);
		this.setChild('lfm_reccoms', lfm_reccoms);
		this.addChild(lfm_reccoms);


	},
	row_name: 'lastfm-recomm'
});



var LfmLoved = function(){}; 
LfmLogin.extendTo(LfmLoved, {
	init: function(auth, pm){
		this._super(auth);
		this.pm = pm;
		this.setRequestDesc(localize('grant-love-lfm-access'));
		this.updateState('can-fetch-crossdomain', true);
		this.updateState('active', true);
	},
	onSession: function(){
		this.updateState('active', false);
	},
	beforeRequest: function() {
		this.bindAuthCallback();
		
	},
	bindAuthCallback: function(){
		var _this = this;
		this.auth.once("session.input_click", function() {
			render_loved();
			_this.pm.hide();
		}, {exlusive: true});
	},
	handleUsername: function(username) {
		render_loved(username);
	}
});



var LastfmLoveRow = function(actionsrow){
		this.init(actionsrow);
};
BaseCRow.extendTo(LastfmLoveRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();
		var lfm_loves = new LfmLoved();
		lfm_loves.init(this.actionsrow.ml.su.lfm_auth, this);
		this.setChild('lfm_loves', lfm_loves);
		this.addChild(lfm_loves);
	},
	row_name: 'lastfm-love'
});
})();