define(['provoda', 'spv', 'app_serv', './comd','./SongsList', 'js/common-libs/htmlencoding', 'js/libs/BrowseMap', './LoadableList', 'js/modules/declr_parsers'],
function(provoda, spv, app_serv, comd, SongsList, htmlencoding, BrowseMap, LoadableList, declr_parsers){
'use strict';
var localize = app_serv.localize;

var VkAudioLogin = function() {};
comd.VkLoginB.extendTo(VkAudioLogin, {
	beforeRequest: function() {
		var _this = this;
		this.bindAuthReady('input_click', function() {
			_this.pmd.loadStart();
			_this.pmd.showOnMap();
		});
	}
});

var no_access_compx = {
	depends_on: ['userid'],
	fn: function(userid) {
		return !userid;
	}
};

var connectUserid = function(params) {
	if (params.vk_userid){
		this.updateState('userid', params.vk_userid);
	} else {
		if (params.for_current_user){
			this.updateState('userid', false);
			this.wch(this.app, 'vk_userid', 'userid');

			if (this.authInit){
				this.authInit();
			}
			if (this.authSwitching){
				this.authSwitching(this.app.vk_auth, VkAudioLogin, {desc: localize('to-play-vk-audio')});
				//this.authSwitching(this.app.lfm_auth, UserCardLFMLogin, {desc: this.access_desc});
			}
			
		} else {
			throw new Error('only for current user or defined user');
		}
	}

	/*
	*/
};

var VkSongList = function() {};
SongsList.extendTo(VkSongList, {
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this.sub_pa_params = {
			vk_userid: params.vk_userid,
			for_current_user: params.for_current_user
		};
		this._super.apply(this, arguments);

		//var user_id = params.vk_userid;
		
		connectUserid.call(this, params);
		//this.user_id = user_id;

		this.initStates();
		//this.authInit();
		//this.authSwitching(this.app.vk_auth, VkAudioLogin);
	}
});

var VkRecommendedTracks = function() {};
VkSongList.extendTo(VkRecommendedTracks, {
	'nest_req-songs-list': [
		[declr_parsers.vk.getTracksFn('response'), function(r) {
			return r && r.response && !!r.response.length;
		}],
		['vk_api', 'get', function() {
			return ['audio.getRecommendations', {
				user_id: this.state('userid')
			}];
		}]

	]
});

var MyVkAudioList = function() {};
VkSongList.extendTo(MyVkAudioList, {
	'nest_req-songs-list': [
		[declr_parsers.vk.getTracksFn('response.items'), {
			props_map: {
				total: ['num', 'response.count'],
				has_data_holes: [true]
			}
		}],
		['vk_api', 'get', function() {
			return ['audio.get', {
				oid: this.state('userid')
			}];
		}]

	]
});

var vk_user_tracks_sp = ['my', 'recommended'];

var VkUserTracks = function() {};
BrowseMap.Model.extendTo(VkUserTracks, {
	model_name: 'vk_users_tracks',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.sub_pa_params = {
			vk_userid: params.vk_userid,
			for_current_user: params.for_current_user
		};
		this.initStates();
	},
	'nest-lists_list':
		[vk_user_tracks_sp],
	'nest-preview_list':
		[vk_user_tracks_sp, true],
	sub_pa: {
		'my': {
			constr: MyVkAudioList,
			getTitle: function() {
				return localize('vk-audio');
			}
		},
		'recommended':{
			constr: VkRecommendedTracks,
			title: localize('VK-Recommended')
		}
	}
});


var VkUserPreview = function() {};
BrowseMap.Model.extendTo(VkUserPreview, {
	init_stmp: {
		userid: 'id',
		first_name: 'first_name',
		last_name: 'last_name',
		photo: 'photo',
		'ava_image.url': 'photo_medium',
		'selected_image.url': 'photo'
	},
	'compx-nav_title': {
		depends_on: ['big_desc'],
		fn: function(big_desc){
			return big_desc;
		}
	},
	'compx-big_desc': {
		depends_on: ['first_name', 'last_name'],
		fn: function(first_name, last_name){
			return [first_name, last_name].join(' ');
		}
	},
	init: function(opts, data) {
		this._super.apply(this, arguments);
		this.mapStates(this.init_stmp, data, true);
		this.initStates();
		this.rawdata = data;
	},
	showOnMap: function() {
		var md = this.app.getVkUser(this.state('userid'));
		md.setProfileData(this.mapStates(this.init_stmp, this.rawdata, {}));
		md.showOnMap();
		//this.app.showLastfmUser(this.state('userid'));
		//this.app.
	}

});


var VKFriendsList = function(){};
LoadableList.extendTo(VKFriendsList, {
	'compx-has_no_access': no_access_compx,
	init: function(opts, params) {
		this._super.apply(this, arguments);
		connectUserid.call(this, params);
		this.sub_pa_params = {
			vk_userid: params.vk_userid,
			for_current_user: params.for_current_user
		};
		this.initStates();
	},

	main_list_name: 'list_items',
	model_name: 'vk_users',
	page_limit: 200,
	getRqData: function() {
		return {
			recenttracks: true,
			user: this.state('userid')
		};
	},
	'nest_rqc-list_items': VkUserPreview,
	'nest_req-list_items': [
		[function(r) {
			return spv.getTargetField(r, 'response.items');
		}, {
			props_map: {
				total: ['num', 'response.count']
			}
		}],
		['vk_api', 'get', function() {
			return ['friends.get', {
				user_id: this.state('userid'),
				fields: ['id', 'first_name', 'last_name', 'sex', 'photo', 'photo_medium', 'photo_big'].join(',')
			}];
		}]
	]
});


return {
	VkUserTracks: VkUserTracks,
	VKFriendsList: VKFriendsList
};
});