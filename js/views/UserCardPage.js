define(['provoda', 'jquery', './coct', './uacq'], function(provoda, $, coct, uacq) {
"use strict";


var UserCardPage = function(){};
coct.PageView.extendTo(UserCardPage, {
	useBase: function(node) {
		this.c = node;
		
		this.bindBase();
	},
	createBase: function() {
		this.c = this.root_view.getSample('user_page');
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
UserCardPage.LfmUsercardPageView = LfmUsercardPageView;
return UserCardPage;
});