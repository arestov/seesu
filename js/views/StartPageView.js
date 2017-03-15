define(function(require) {
'use strict';
var spv = require('spv');
var $ = require('jquery');
var UserCardPreview = require('./UserCardPreview');
var coct = require('./coct');


var finup = function(callback) {
	callback.finup = true;
	return callback;
};


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
	'compx-lo_at_page': [[]],
	'compx-ask_rating_help': [['ask-rating-help', '#locales.at-this-page', '#locales.ask-rating-help'], function(link, lo_at_page, text) {
		return link && lo_at_page && {
			link: link,
			link_text: lo_at_page,
			text: text
		};
	}],
	state_change: {
		"can_expand": function(target, state) {
			if (state){
				target.requirePart('start-page-blocks');
			}
		},
		"ask_rating_help": finup(function(target, obj){
			var anchor = target.tpl.ancs.help_text;
			if (!obj) {
				// anchor.empty();
			} else {
				var url = $("<a class='external'></a>")
					.attr('href', obj.link)
					.text(obj.link_text);

				anchor.append(spv.createComlexText(obj.text).setVar("app_url", url[0]));
			}
		})
	},
	parts_builder: {
		'start-page-blocks': function() {
			return true;
		}
	}
});
return StartPageView;
});
