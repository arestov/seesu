var LfmCommonLoginView = function(){};
LfmLoginView.extendTo(LfmCommonLoginView, {
	createBase: function(){
		this._super();
		this.un_form = this.root_view.samples.lfm_input.clone().appendTo(this.c);
		this.un_input = this.un_form.find('.lfm-username');

		var _this = this;
		this.un_form.on('submit', function(e) {
			_this.md.handleUsername(_this.un_input.val());
			return false;
		});
	},
	'stch-can-fetch-crossdomain': function(state) {
		if (state){
			this.un_form.removeClass('needs-cross-domain');
		} else {
			this.un_form.addClass('needs-cross-domain');
		}
		
	}
});




var LastfmRecommRowView = function(){};
BaseCRowUI.extendTo(LastfmRecommRowView, {
	createDetailes: function(){

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

		this.c.append(this.getAFreeCV('lfm_reccoms'));

		this.requestAll();
	},
	children_views: {
		'lfm_reccoms': LfmCommonLoginView
	}
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


		this.c.append(this.getAFreeCV('lfm_loves'));

		this.requestAll();
	},
	children_views: {
		'lfm_loves': LfmCommonLoginView
	}
});



var FastPSRowView = function(){};
ActionsRowUI.extendTo(FastPSRowView, {
	createBase: function(c){
		this.c = this.parent_view.els.fast_personal_start;
		this.row_context = this.c.find('.row-context');
		this.arrow = this.row_context.children('.rc-arrow');
		this.buttons_panel = this.c;
	},

	children_views: {
		"lastfm-recomm": {
			main: LastfmRecommRowView
		},
		"lastfm-love": {
			main: LastfmLoveRowView
		}
	}
});

var MusicConductorView = function() {};
provoda.View.extendTo(MusicConductorView, {
	createDetailes: function() {
		createBase();
	},
	createBase: function() {
		this.c = $('<div></div>');
		this.header = $('<h4></h4>').appendTo(this.c);
	},
	'stch-nav-title': function(state) {
		this.header.text(state || '');
	}
});


var StartPageView = function(){};

provoda.View.extendTo(StartPageView, {
	createDetailes: function(){
		var _this = this;

		this.els = this.root_view.els;
		this.c = this.els.start_screen;

		var hq_link = this.c.find('#hint-query');
		hq_link.text(su.popular_artists[(Math.random()*10).toFixed(0)]);
		hq_link.click(function(e) {
			e.preventDefault();
			var query = hq_link.text();
			su.search(query);
			hq_link.text(su.popular_artists[(Math.random()*10).toFixed(0)]);
			su.trackEvent('Navigation', 'hint artist');

		});
		
		
	},
	'collch-muco': function(name, md) {
		var view = this.getFreeChildView(name, md, 'main');
		this.requestAll();
	},
	'collch-pstuff': function(name, md) {
		var view = this.getFreeChildView(name, md, 'main');
		this.requestAll();
	},
	'collch-fast_pstart': function(name, md) {
		var view = this.getFreeChildView(name, md, 'main');
		this.requestAll();
	},
	children_views: {
		muco:{
			main: MusicConductorPreview
		},
		fast_pstart: {
			main: FastPSRowView
		},
		pstuff: {
			main: UserCardPreview
		}
	},
	complex_states: {
		'mp-show-end': {
			depends_on: ['map-animating', 'vis-mp-show', 'mp-show'],
			fn: function(anim, vis_mp_show, mp_show) {
				if (anim) {
					if (vis_mp_show && anim == vis_mp_show.anid){
						return vis_mp_show.value;
					} else {
						return false;
					}
					
				} else {
					return mp_show;
				}
			}
		}
	},
	state_change: {
		'mp-show': function(opts) {
			if (opts){
				if (opts.userwant){
			//		this.search_input[0].focus();
				//	this.search_input[0].select();
				}
			} else {
				
			}
		},
		"can-expand": function(state) {
			if (state){
				this.requirePart('start-page-blocks');
			}
		},
		"have-playlists": function(state){
			if (state){
				if (!this.plts_link){
					this.plts_link =  this.els.fast_personal_start.children('.cus-playlist-b');
					var _this = this;
					this.plts_link.children('a').click(function(e){
						e.preventDefault();
						_this.md.getChild('fast_pstart').hideAll();
						_this.md.showPlaylists();
						
					});
				}
				this.plts_link.removeClass('hidden');
			}
		},
	
		"ask-rating-help": function(link){
			var _this = this;

			if (link){
				var spm_c = this.els.start_screen.find('.start-page-messages');
				this.message_arh_c = $('<div class="attention-message"></div>');

				$("<a class='close-message'>×</a>").appendTo(this.message_arh_c).click(function() {
					_this.md.closeMessage('rating-help');
				});
				$('<img class="message-image"/>').attr({
					src: 'http://cs9767.userapi.com/u198193/b_b379d470.jpg',
					width: 100,
					height: 126,
					alt: "Gleb Arestov"
				}).appendTo(this.message_arh_c);


				

				var url = $("<a class='external'></a>").attr('href', link).text(localize('at-this-page'));
				this.message_arh_c.append(createComlexText(localize("ask-rating-help")).setVar("app_url", url[0]));
				spm_c.append(this.message_arh_c);

				/*
				

				Поддержи сису — поставь оценку
				
				*/
			} else {
				if (this.message_arh_c){
					this.message_arh_c.remove();
	
				}
			}
		}
	},
	parts_builder: {
		'start-page-blocks': function() {
			return true;
		}
	}
});
