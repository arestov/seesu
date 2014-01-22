define(['provoda', 'jquery', './coct', './uacq', 'app_serv'], function(provoda, $, coct, uacq, app_serv) {
"use strict";
var app_env = app_serv.app_env;

var UserCardPage = function(){};
coct.PageView.extendTo(UserCardPage, {
	useBase: function(node) {
		this.c = node;
		
		this.bindBase();
	},
	createBase: function() {
		this.c = this.root_view.getSample('user_page');
		this.c.append(this.root_view.getSample('vk_pthgs'));
		this.c.append(this.root_view.getSample('lastfm_pthgs'));
		this.bindBase();
	},
	bindBase: function() {
		this.createTemplate();
	},
	children_views: {
		'user-playlists': coct.ListSimplePreview,
		users_acqutes: uacq.UserAcquaintancesListPreview,
		vk__tracks: coct.ListSimplePreview,
		vk__friends: coct.ImagedListPreview,
		lfm__friends: coct.ImagedListPreview,
		lfm__neighbours: coct.ImagedListPreview,
		lfm__artists: coct.ListSimplePreview,
		lfm__tracks: coct.ListSimplePreview,
		lfm__tags: coct.ListSimplePreview,
		lfm__albums: coct.ListSimplePreview
	},
	'collch-users_acqutes': 'tpl.ancs.users_acqutes'
});

var LfmUsercardPageView = function() {};
provoda.View.extendTo(LfmUsercardPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('lfm_user_page');
		this.c.append(this.root_view.getSample('lastfm_pthgs'));
		this.bindBase();
	},
	bindBase: function() {
		this.createTemplate();
	},
	children_views: {
		lfm__friends: coct.ImagedListPreview,
		lfm__neighbours: coct.ImagedListPreview,
		lfm__artists: coct.ListSimplePreview,
		lfm__tracks: coct.ListSimplePreview,
		lfm__tags: coct.ListSimplePreview,
		lfm__albums: coct.ListSimplePreview
	}
});


var VkUsercardPageView = function() {};
provoda.View.extendTo(VkUsercardPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('vk_user_page');
		this.c.append(this.root_view.getSample('vk_pthgs'));
		this.bindBase();
	},
	bindBase: function() {
		this.createTemplate();
	},
	children_views: {
		vk__tracks: coct.ListSimplePreview,
		vk__friends: coct.ImagedListPreview
	}
});

var VkFriendPreview = function() {};
provoda.View.extendTo(VkFriendPreview, {
	tpl_events: {
		open_link: function(e, node) {
			e.preventDefault();
			e.stopPropagation();
			app_env.openURL($(node).attr('href'));
			seesu.trackEvent('Links', 'just link');
		}
	}
});

var VkUsersPageView = function() {};
provoda.View.extendTo(VkUsersPageView, {
	base_tree: {
		sample_name: 'vk_users_page'
	},
	children_views: {
		list_items: VkFriendPreview
	}
});


UserCardPage.LfmUsercardPageView = LfmUsercardPageView;
UserCardPage.VkUsercardPageView = VkUsercardPageView;
UserCardPage.VkUsersPageView = VkUsersPageView;
return UserCardPage;
});