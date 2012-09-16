
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

		this.fast_pstart = new FastPSRow(this);



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


var FastPSRowView = function(){};
ActionsRowUI.extendTo(FastPSRowView, {
	createBase: function(c){
		this.c = this.parent_view.els.fast_personal_start;
		this.row_context = this.c.find('.row-context');
		this.arrow = this.row_context.children('.rc-arrow');
		this.buttons_panel = this.c;
	}
});


var FastPSRow = function(parent_m){
	this.init(parent_m);
};

PartsSwitcher.extendTo(FastPSRow, {
	init: function(ml) {
		this._super();
		this.ml = ml;
		this.updateState('active_part', false);
		this.addPart(new LastfmRecommRow(this, ml));
		this.addPart(new LastfmLoveRow(this, ml));
	//	this.addPart(new MultiAtcsRow(this, pl));
	//	this.addPart(new PlaylistSettingsRow(this, pl));
	},
	ui_constr: FastPSRowView
});




var LastfmRecommRowView = function(){};
	BaseCRowUI.extendTo(LastfmRecommRowView, {
		createDetailes: function(){

			var parent_c = this.parent_view.row_context;
			var buttons_panel = this.parent_view.buttons_panel;
			var parent_c = this.parent_view.row_context; 
			var buttons_panel = this.parent_view.buttons_panel;
			var md = this.md;
			this.c = parent_c.children('.lfm-recomm');
			this.button = buttons_panel.find('#lfm-recomm').click(function(){
				if (!lfm.sk){
					md.switchView();
				} else {
					render_recommendations();
				}
				
				return false;
			});
		},
		expand: function() {
			if (this.expanded){
				return;
			} else {
				this.expanded = true;
			}
			var lfm_reccoms_view = this.md.lfm_reccoms.getFreeView(this);
			if (lfm_reccoms_view){
				this.c.append(lfm_reccoms_view.getA());
				this.addChild(lfm_reccoms_view);
				
			}
			this.requestAll();
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
	row_name: 'lastfm-recomm',
	ui_constr: LastfmRecommRowView
});


var LastfmLoveRowView = function(){};
	BaseCRowUI.extendTo(LastfmLoveRowView, {
		createDetailes: function(){
			var parent_c = this.parent_view.row_context; 
			var buttons_panel = this.parent_view.buttons_panel;
			var md = this.md;
			this.c = parent_c.children('.lfm-loved');
			this.button = buttons_panel.find('#lfm-loved').click(function(){
				if (!lfm.sk){
					md.switchView();
				} else {
					render_loved();
				}
				
				return false;
			});
		},
		expand: function() {
			if (this.expanded){
				return;
			} else {
				this.expanded = true;
			}
			var lfm_loves_view = this.md.lfm_loves.getFreeView(this);
			if (lfm_loves_view){
				this.c.append(lfm_loves_view.getA());
				this.addChild(lfm_loves_view);
				
			}
			this.requestAll();
		}
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
	row_name: 'lastfm-love',
	ui_constr: LastfmLoveRowView
});
