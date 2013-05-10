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
		this.bindBase();
	},
	bindBase: function() {
		this.createTemplate();
	},
	children_views: {
		'user-playlists': coct.LiListsPreview,
		users_acqutes: uacq.UserAcquaintancesListPreview,
		vk_audio: PersonalListPreview,
		arts_recomms: PersonalListPreview,
		lfm_listened: PersonalListPreview,
		lfm_loved: PersonalListPreview,
		new_releases: PersonalAlbumsListPreview,
		recomm_releases: PersonalAlbumsListPreview
	},
	'collch-users_acqutes': 'tpl.ancs.users_acqutes'
});



return UserCardPage;
});