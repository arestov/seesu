
mainLevel = function() {};

suMapModel.extendTo(mainLevel, {
	model_name: 'start_page',
	page_name: 'start page',
	showPlaylists: function(){
		su.app_md.search(':playlists');
	},
	init: function(su){
		this._super();
		this.su = su;
		this.updateState('nav-title', 'Seesu start page');

		var fast_pagestart = new FastPSRow();
		fast_pagestart.init(this);

		this.setChildren('fast_pstart', [fast_pagestart]);



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
	//	this.addPart(new MultiAtcsRow(this, pl));
	//	this.addPart(new PlaylistSettingsRow(this, pl));
	}
});

var LastfmRecommRow = function(actionsrow){
		this.init(actionsrow);
};
BaseCRow.extendTo(LastfmRecommRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();
		//this.lfm_scrobble = new LfmScrobble(su.lfm_auth);
		this.lfm_reccoms = new LfmReccoms(this.actionsrow.ml.su.lfm_auth, this);
		this.addChild(this.lfm_reccoms);
	},
	row_name: 'lastfm-recomm'
});

var LastfmLoveRow = function(actionsrow){
		this.init(actionsrow);
};
BaseCRow.extendTo(LastfmLoveRow, {
	init: function(actionsrow){
		this.actionsrow = actionsrow;
		this._super();
		//this.lfm_scrobble = new LfmScrobble(su.lfm_auth);
		this.lfm_loves = new LfmLoved(this.actionsrow.ml.su.lfm_auth, this);
		this.addChild(this.lfm_loves);
	},
	row_name: 'lastfm-love'
});
