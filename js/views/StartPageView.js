define(['provoda', 'spv', 'jquery', 'app_serv', './MusicConductorPreview', './UserCardPreview', './coct'],
function(provoda, spv, $, app_serv, MusicConductorPreview, UserCardPreview, coct) {
"use strict";
var localize = app_serv.localize;

var StartPageView = function(){};

coct.SPView.extendTo(StartPageView, {
	createDetails: function(){

		this.els = this.root_view.els;
		this.c = this.els.start_screen;
		this.createTemplate();


		this.addWayPoint(this.tpl.ancs['hint-query'], {
			//simple_check: true
		});


		var _this = this;
		var checkFocus = function(state) {
			if (state){
				_this.nextLocalTick(_this.tickCheckFocus);
			}
		};
		this.on('state_change-autofocus', function(e) {
			checkFocus(e.value);
		}, {immediately: true});
	},

	tickCheckFocus: function() {
		if (this.isAlive()){
			this.root_view.search_input[0].focus();
			this.root_view.search_input[0].select();
		}
	},
	'collch-muco': true,
	'collch-pstuff': true,
	'collch-tags': true,
	children_views: {
		muco:{
			main: MusicConductorPreview
		},
		pstuff: {
			main: UserCardPreview
		},
		tags: coct.ListPreview
	},
	'compx-autofocus': {
		depends_on: ['mp_show_end', 'mp_has_focus'],
		fn: function(shw_end, focus) {
			return focus && shw_end;
		}
	},
	state_change: {

		"can_expand": function(state) {
			if (state){
				this.requirePart('start-page-blocks');
			}
		},
		"ask-rating-help": function(link){
			var _this = this;

			if (link){
				var spm_c = this.tpl.ancs['start-page-messages'];
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
				this.message_arh_c.append(spv.createComlexText(localize("ask-rating-help")).setVar("app_url", url[0]));
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
return StartPageView;
});