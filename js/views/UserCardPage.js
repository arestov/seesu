define(function(require) {
'use strict';
var $ = require('jquery');
var coct = require('./coct');
var uacq = require('./uacq');
var env = require('env');
var spv = require('spv');
var View = require('View');

var app_env = env;

var UserCardPage = spv.inh(coct.PageView, {}, {
	base_tree: {
		sample_name: 'user_page'

	},
	children_views: {
		// 'user-playlists': coct.ListSimplePreview,
		users_acqutes: uacq.UserAcquaintancesListPreview,
		// vk__tracks: coct.ListSimplePreview,
		// vk__friends: coct.ImagedListPreview,
		// lfm__friends: coct.ImagedListPreview,
		// lfm__neighbours: coct.ImagedListPreview,
		// lfm__artists: coct.ListSimplePreview,
		// lfm__tracks: coct.ListSimplePreview,
		// lfm__tags: coct.ListSimplePreview,
		// lfm__albums: coct.ListSimplePreview
	},
	'collch-users_acqutes': 'tpl.ancs.users_acqutes'
});

var LfmUsercardPageView = spv.inh(View, {}, {
	base_tree: {
		sample_name: 'lfm_user_page'
	},
	children_views: {
		// lfm__friends: coct.ImagedListPreview,
		// lfm__neighbours: coct.ImagedListPreview,
		// lfm__artists: coct.ListSimplePreview,
		// lfm__tracks: coct.ListSimplePreview,
		// lfm__tags: coct.ListSimplePreview,
		// lfm__albums: coct.ListSimplePreview
	}
});


var VkUsercardPageView = spv.inh(View, {}, {
	base_tree: {
		sample_name: 'vk_user_page'
	},
	children_views: {
		// vk__tracks: coct.ListSimplePreview,
		// vk__friends: coct.ImagedListPreview
	}
});

var VkFriendPreview = spv.inh(View, {}, {
	tpl_events: {
		open_link: function(e, node) {
			e.preventDefault();
			e.stopPropagation();
			app_env.openURL($(node).attr('href'));
			this.root_view.trackEvent('Links', 'just link');
		}
	}
});

var VkUsersPageView = spv.inh(View, {}, {
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
