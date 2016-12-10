define(['pv', 'spv', 'app_serv', './comd','./SongsList', 'js/common-libs/htmlencoding', 'js/libs/BrowseMap', './LoadableList', 'js/modules/declr_parsers'],
function(pv, spv, app_serv, comd, SongsList, htmlencoding, BrowseMap, LoadableList, declr_parsers){
'use strict';
var pvUpdate = pv.update;
var cloneObj = spv.cloneObj;

var VkAudioLogin = spv.inh(comd.VkLoginB, {}, {
	'compx-access_desc': [['#locales.to-play-vk-audio']],
	beforeRequest: function() {
		var auth = this.getNesting('auth');
		pvUpdate(auth, 'requested_by', this._provoda_id);
	},
	'compx-active': [
		['has_session', '@one:requested_by:auth'],
		function(has_session, requested_by) {
			return has_session && requested_by == this._provoda_id;
		}
	]
});

var no_access_compx = {
	depends_on: ['userid'],
	fn: function(userid) {
		return !userid;
	}
};

var auth_bh = {
	'compx-has_no_access': no_access_compx,
	'nest-pmd_switch': ['^'],
	'nest-auth_part': [VkAudioLogin, {
		ask_for: 'for_current_user'
	}],

	'compx-userid': [
		['vk_userid', '#vk_userid', 'for_current_user'],
		function(vk_userid, cur_vk_userid, for_current_user) {
			return (for_current_user ? cur_vk_userid : vk_userid) || null;
		}
	],
	'compx-has_vk_auth': [
		['for_current_user', '@one:has_session:auth_part'],
		function(for_current_user, sess) {
			return for_current_user && sess;
		}
	],

	'compx-parent_focus': [['^mp_has_focus']],
	'stch-has_vk_auth': function(target, state) {
		if (state) {
			// если появилась авторизация,
			// то нужно выключить предложение авторизоваться
			target.switchPmd(false);
		}
	},
	'stch-parent_focus': function(target, state) {
		if (!state) {
			// если обзорная страница потеряла фокус,
			// то нужно выключить предложение авторизоваться
			target.switchPmd(false);
		}
	},
	'stch-vk_userid': function(target, state) {
		if (state) {
			target.updateNesting('auth_part', null);
		}
	},

	'compx-acess_ready': [
		['has_no_access', '@one:active:auth_part'],
		function(no_access, active_auth) {
			return !no_access && active_auth;
		}
	],
	'stch-acess_ready': function(target, state) {
		if (state) {
			target.loadStart();
			target.showOnMap();
		}
	}
};

var VkSongList = spv.inh(SongsList, {}, cloneObj({}, auth_bh));

var VkRecommendedTracks = spv.inh(VkSongList, {}, {
	'nest_req-songs-list': [
		[declr_parsers.vk.getTracksFn('response'), function(r) {
			return r && r.response && !!r.response.length;
		}],
		['vktapi', 'get', function() {
			return ['audio.getRecommendations', {
				user_id: this.state('userid')
			}];
		}]

	]
});

var MyVkAudioList = spv.inh(VkSongList, {}, {
	'nest_req-songs-list': [
		[declr_parsers.vk.getTracksFn('response.items'), {
			props_map: {
				total: ['num', 'response.count'],
				has_data_holes: [true]
			}
		}],
		['vktapi', 'get', function() {
			return ['audio.get', {
				oid: this.state('userid')
			}];
		}]

	]
});

var vk_user_tracks_sp = ['my', 'recommended'];

var VkUserTracks = spv.inh(BrowseMap.Model, {}, {
	model_name: 'vk_users_tracks',
	'nest-lists_list':
		[vk_user_tracks_sp],
	'nest-preview_list':
		[vk_user_tracks_sp, {
			preload_on: 'mp_has_focus'
		}],
	sub_page: {
		'my': {
			constr: MyVkAudioList,
			title: [['#locales.vk-audio']]
		},
		'recommended':{
			constr: VkRecommendedTracks,
			title: [['#locales.VK-Recommended']]
		}
	}
});

var VKFriendsList = spv.inh(LoadableList, {}, cloneObj({
	main_list_name: 'list_items',
	model_name: 'vk_users',
	page_limit: 200,
	'nest_rqc-list_items': '#users/vk:[:userid]',
	'nest_req-list_items': [
		[
			{
				is_array: true,
				source: 'response.items',
				props_map: {
					userid: 'id',
					first_name: 'first_name',
					last_name: 'last_name',
					photo: 'photo',
					'ava_image.url': 'photo_medium',
					'selected_image.url': 'photo'
				},
			},
		 {
			props_map: {
				total: ['num', 'response.count']
			}
		}],
		['vktapi', 'get', function() {
			return ['friends.get', {
				user_id: this.state('userid'),
				fields: ['id', 'first_name', 'last_name', 'sex', 'photo', 'photo_medium', 'photo_big'].join(',')
			}];
		}]
	]
}, auth_bh));


return {
	VkUserTracks: VkUserTracks,
	VKFriendsList: VKFriendsList
};
});
