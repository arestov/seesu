define(['provoda', './coct', 'app_serv', 'jquery'], function(provoda, coct, app_serv, $) {
"use strict";
var app_env = app_serv.app_env;
var LULAPageVIew = function() {};
provoda.View.extendTo(LULAPageVIew, {
	createBase: function() {
		this.c = this.root_view.getSample('lula_page');
		this.createTemplate();
	},
	children_views: {
		all_time: coct.ListPreview
	}

});

var LULAsPageVIew = function() {};
provoda.View.extendTo(LULAsPageVIew, {
	createBase: function() {
		this.c = this.root_view.getSample('lulas_page');
		this.createTemplate();
	}
});
var UserTagPageView = function() {};
provoda.View.extendTo(UserTagPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('user_tag_page');
		this.createTemplate();
	},
	children_views: {
		tracks: coct.ListPreview,
		artists: coct.ListPreview,
		albums: coct.ListPreview
	}
});

var UserTagsPageView = function() {};
provoda.View.extendTo(UserTagsPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('user_tags_page');
		this.createTemplate();
	}
});

var LfmFriendPreview = function() {};
provoda.View.extendTo(LfmFriendPreview, {
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
provoda.View.extendTo(LfmUsersPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('lfm_users_page');
		this.createTemplate();
	},
	children_views: {
		list_items: LfmFriendPreview
	}
});

return {
	LULAPageVIew: LULAPageVIew,
	LULAsPageVIew: LULAsPageVIew,
	UserTagsPageView: UserTagsPageView,
	UserTagPageView: UserTagPageView,
	LfmUsersPageView: LfmUsersPageView
};
});