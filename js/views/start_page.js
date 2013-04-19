

var MusicConductorView = function() {};
provoda.View.extendTo(MusicConductorView, {
	createDetailes: function() {
		createBase();
	},
	createBase: function() {
		this.c = $('<div></div>');
		this.header = $('<h4></h4>').appendTo(this.c);
	},
	'stch-nav_title': function(state) {
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
		
		this.addWayPoint(hq_link, {
			//simple_check: true
		});
	},
	'collch-muco': true,
	'collch-pstuff': true,
	children_views: {
		muco:{
			main: MusicConductorPreview
		},
		pstuff: {
			main: UserCardPreview
		}
	},
	complex_states: {
		'mp_show_end': {
			depends_on: ['map_animating', 'vis_mp_show', 'mp_show'],
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
		},
		autofocus: {
			depends_on: ['mp_show_end', 'mp_has_focus'],
			fn: function(shw_end, focus) {
				return focus && shw_end && shw_end.userwant;
			}
		}
	},
	state_change: {
		'mp_show': function(opts) {
			if (opts){
				if (opts.userwant){
			//		this.search_input[0].focus();
				//	this.search_input[0].select();
				}
			} else {
				
			}
		},
		"can_expand": function(state) {
			if (state){
				this.requirePart('start-page-blocks');
			}
		},
	
		"ask-rating-help": function(link){
			var _this = this;

			if (link){
				var spm_c = this.els.start_screen.find('.start-page-messages');
				this.message_arh_c = $('<div class="attention-message"></div>');

				$("<a class='close-message'>×</a>").appendTo(this.message_arh_c).click(function() {
					_this.RPCLegacy('closeMessage', 'rating-help');
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
