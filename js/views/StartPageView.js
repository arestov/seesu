define(['pv', 'spv', 'jquery', 'app_serv', './UserCardPreview', './coct'],
function(pv, spv, $, app_serv, UserCardPreview, coct) {
"use strict";
var localize = app_serv.localize;

var StartPageView = spv.inh(coct.SPView, {}, {
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

		"can_expand": function(target, state) {
			if (state){
				target.requirePart('start-page-blocks');
			}
		},
		"ask-rating-help": function(target, link){

			if (link){
				var spm_c = target.tpl.ancs['start-page-messages'];
				target.message_arh_c = $('<div class="attention-message"></div>');

				$("<a class='close-message'>×</a>").appendTo(target.message_arh_c).click(function() {
					target.RPCLegacy('closeMessage', 'rating-help');
				});
				$('<img class="message-image"/>').attr({
					src: 'http://cs9767.userapi.com/u198193/b_b379d470.jpg',
					width: 100,
					height: 126,
					alt: "Gleb Arestov"
				}).appendTo(target.message_arh_c);


				var url = $("<a class='external'></a>").attr('href', link).text(localize('at-this-page'));
				target.message_arh_c.append(spv.createComlexText(localize("ask-rating-help")).setVar("app_url", url[0]));
				spm_c.append(target.message_arh_c);

				/*


				Поддержи сису — поставь оценку

				*/
			} else {
				if (target.message_arh_c){
					target.message_arh_c.remove();
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
