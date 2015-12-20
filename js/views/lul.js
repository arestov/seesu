define(['pv', './coct', 'env', 'jquery', 'spv'], function(pv, coct, env, $, spv) {
"use strict";
var app_env = env;
var LULAPageVIew = spv.inh(pv.View, {}, {
	base_tree: {
		sample_name: 'lula_page'
	},
	children_views: {
		all_time: coct.ImagedListPreview
	}

});

var LULAsPageVIew = spv.inh(pv.View, {}, {
	base_tree: {
		sample_name: 'lulas_page'
	}
});


var UserTagsPageView = spv.inh(pv.View, {}, {
	base_tree: {
		sample_name: 'user_tags_page'
	}
});

var LfmFriendPreview = spv.inh(pv.View, {}, {
	tpl_events: {
		open_link: function(e, node) {
			e.preventDefault();
			e.stopPropagation();
			app_env.openURL($(node).attr('href'));
			this.root_view.trackEvent('Links', 'just link');
		}
	}
});

var LfmUsersPageView = spv.inh(pv.View, {}, {
	base_tree: {
		sample_name: 'lfm_users_page'
	},
	children_views: {
		list_items: LfmFriendPreview
	}
});

return {
	LULAPageVIew: LULAPageVIew,
	LULAsPageVIew: LULAsPageVIew,
	UserTagsPageView: UserTagsPageView,
	LfmUsersPageView: LfmUsersPageView
};
});
