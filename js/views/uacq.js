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

var UserAcquaintancesListPreview = spv.inh(View, {}, {
	base_tree: {
		sample_name: 'user_acqes-preview'
	}
});


return {
	UserAcquaintanceView:UserAcquaintanceView,
	UserAcquaintancesListView:UserAcquaintancesListView,
	UserAcquaintancesListPreview:UserAcquaintancesListPreview
};

});
