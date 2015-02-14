define(['pv', './coct', 'app_serv', 'jquery'], function(pv, coct, app_serv, $) {
"use strict";
var app_env = app_serv.app_env;
var LULAPageVIew = function() {};
pv.View.extendTo(LULAPageVIew, {
	base_tree: {
		sample_name: 'lula_page'
	},
	children_views: {
		all_time: coct.ImagedListPreview
	}

});

var LULAsPageVIew = function() {};
pv.View.extendTo(LULAsPageVIew, {
	base_tree: {
		sample_name: 'lulas_page'
	}
});


var UserTagsPageView = function() {};
pv.View.extendTo(UserTagsPageView, {
	base_tree: {
		sample_name: 'user_tags_page'
	}
});

var LfmFriendPreview = function() {};
pv.View.extendTo(LfmFriendPreview, {
	tpl_events: {
		open_link: function(e, node) {
			e.preventDefault();
			e.stopPropagation();
			app_env.openURL($(node).attr('href'));
			seesu.trackEvent('Links', 'just link');
		}
	}
});

var LfmUsersPageView = function() {};
pv.View.extendTo(LfmUsersPageView, {
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