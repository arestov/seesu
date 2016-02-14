define(['pv', 'jquery', 'app_serv', './coct', 'spv', 'View'], function(pv, $, app_serv, coct, spv, View) {
'use strict';

var UserAcquaintanceView = spv.inh(View, {}, {
	'compx-lo_accept_inv': [['#locales.accept-inv']]
});

var UserAcquaintancesListView = spv.inh(coct.PageView, {}, {
	'compx-lo_from_people': [['#locales.rels-people-you']],
	'compx-lo_from_you': [['#locales.rels-you-people']],
	base_tree: {
		sample_name: 'relations_page'
	},
	children_views: {
		acqs_from_someone: UserAcquaintanceView,
		acqs_from_me: UserAcquaintanceView
	}
});

var UserAcqPreview = spv.inh(View, {}, {
	dom_rp: true,
	createBase: function() {
		this.c = $("<span></span>");
		this.userimg = $('<img/>').attr('src', 'https://vk.com/images/camera_b.gif').appendTo(this.c);
		this.dom_related_props.push('userimg');

	},
	'stch-user_photo': function(target, state) {
		if (state){
			target.userimg.attr('src', state);
		}
	}
});
var UserAcquaintancesListPreview = spv.inh(View, {}, {
	dom_rp: true,
	createBase: function() {
		this.c = $('<div class="user_acqes-preview"></div>');
		this.sended_tome_c = $('<span></span>').appendTo(this.c);

		var _this = this;

		this.c.click(function() {
			_this.requestPage();
		});

		this.acqs_frsmone_c = $('<span></span>').appendTo(this.c);
		this.acqs_frme_c = $('<span></span>').appendTo(this.c);
		this.dom_related_props.push('sended_tome_c', 'acqs_frsmone_c', 'acqs_frme_c');
	},
	children_views: {
		acqs_from_someone: {
			main: UserAcqPreview
		},
		acqs_from_me: {
			main: UserAcqPreview
		}
	},
	'collch-acqs_from_someone': 'acqs_frsmone_c',
	'collch-acqs_from_me': 'acqs_frme_c'

});


return {
	UserAcquaintanceView:UserAcquaintanceView,
	UserAcquaintancesListView:UserAcquaintancesListView,
	UserAcqPreview:UserAcqPreview,
	UserAcquaintancesListPreview:UserAcquaintancesListPreview
};

});
