define(['provoda', 'jquery', './coct', './uacq', './etc_views'], function(provoda, $, coct, uacq, etc_views) {
"use strict";

var SoftVkLoginUI = function() {};
etc_views.VkLoginUI.extendTo(SoftVkLoginUI, {
	createBase: function() {
		this._super();
		this.c.removeClass('attention-focuser');
	}
});




var PersonalListPreview = function() {};
coct.ListPreview.extendTo(PersonalListPreview, {
	clickAction: function() {
		this.RPCLegacy('requestPage');
	},
	'stch-pmd_vswitched': function(state) {
		this.c.toggleClass('access-request', state);
	},
	children_views: {
		auth_block_lfm: etc_views.LfmLoginView,
		auth_block_vk: SoftVkLoginUI,
		preview_list: coct.ArtistsListPreviewLine
	},
	'collch-auth_part': {
		place: 'tpl.ancs.auth_con',
		by_model_name: true
	},
	'collch-preview_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	}
});
var PersonalAlbumsListPreview = function() {};
coct.AlbumsListPreview.extendTo(PersonalAlbumsListPreview, {
	clickAction: function() {
		this.RPCLegacy('requestPage');
	},
	'stch-pmd_vswitched': function(state) {
		this.c.toggleClass('access-request', state);
	},
	children_views: {
		auth_block_lfm: etc_views.LfmLoginView,
		auth_block_vk: SoftVkLoginUI,
		preview_list: coct.AlbumsListPreviewItem
	},
	'collch-auth_part': {
		place: 'tpl.ancs.auth_con',
		by_model_name: true
	},
	'collch-preview_list': {
		place: 'tpl.ancs.listc',
		limit: 15
	}
});


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