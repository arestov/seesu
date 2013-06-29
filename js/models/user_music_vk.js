define(['provoda', 'spv', 'app_serv', './comd','./SongsList', 'js/common-libs/htmlencoding', 'js/libs/BrowseMap', './LoadableList'],
function(provoda, spv, app_serv, comd, SongsList, htmlencoding, BrowseMap, LoadableList){
'use strict';
var localize = app_serv.localize;

var VkAudioLogin = function() {};
comd.VkLoginB.extendTo(VkAudioLogin, {
	init: function(opts) {
		this._super(opts,  {
			open_opts: {settings_bits: 8},
			desc: localize('to-play-vk-audio')
		});
	},
	beforeRequest: function() {
		var _this = this;
		this.bindAuthReady('input_click', function() {
			_this.pmd.loadStart();
			_this.pmd.showOnMap();
		});
	}
});

var VkSongList = function() {};
SongsList.extendTo(VkSongList, {
	'compx-has_no_access': {
		depends_on: ['has_no_auth'],
		fn: function(no_auth) {
			return no_auth;
		}
	},
	init: function(opts, params) {
		this._super(opts);

		var user_id = params.vk_id;
		this.sub_pa_params = {
			vk_id: params.vk_id,
			for_current_user: params.for_current_user
		};

		this.user_id = user_id;

		this.initStates();
		this.authInit();
		this.authSwitching(this.app.vk_auth, VkAudioLogin);
	}
});

var VkRecommendedTracks = function() {};
VkSongList.extendTo(VkRecommendedTracks, {
	sendMoreDataRequest: function(paging_opts) {
		var request_info = {};
		var _this = this;

		request_info.request = this.app.vk_api.get('audio.getRecommendations', {
			sk: this.app.lfm.sk,
			count: paging_opts.page_limit,
			offset: (paging_opts.next_page - 1) * paging_opts.page_limit
		})
			.done(function(r){
				if (!r || r.error){
					_this.requestComplete(request_info.request, true);
					return;
				}
				var vk_search = _this.app.mp3_search.getSearchByName('vk');
				var track_list = [];

				for (var i = 0; i < r.response.length; i++) {
					var cur = r.response[i];
					track_list.push({
						artist: htmlencoding.decode(cur.artist),
						track: htmlencoding.decode(cur.title),
						file: vk_search.makeSongFile(cur)
					});
				}

				_this.putRequestedData(request_info.request, track_list, r.error);

			})
			.fail(function(){
				_this.requestComplete(request_info.request, true);
			}).always(function() {
				request_info.done = true;
			});
		return request_info;
	}
});

var MyVkAudioList = function() {};
VkSongList.extendTo(MyVkAudioList, {
	sendMoreDataRequest: function(paging_opts) {
		var request_info = {};
		var _this = this;

		request_info.request = this.app.vk_api.get('audio.get', {
			count: paging_opts.page_limit,
			offset: (paging_opts.next_page - 1) * paging_opts.page_limit
		})
			.done(function(r){
				if (!r || r.error){
					_this.requestComplete(request_info.request, true);
					return;
				}
				var vk_search = _this.app.mp3_search.getSearchByName('vk');
				var track_list = [];

				for (var i = 0; i < r.response.length; i++) {
					var cur = r.response[i];
					track_list.push({
						artist: htmlencoding.decode(cur.artist),
						track: htmlencoding.decode(cur.title),
						file: vk_search.makeSongFile(cur)
					});
				}
				_this.putRequestedData(request_info.request, track_list, r.error);
			})
			.fail(function(){
				_this.requestComplete(request_info.request, true);
			}).always(function() {
				request_info.done = true;
			});
		return request_info;
	}
});

var VkUserTracks = function() {};
BrowseMap.Model.extendTo(VkUserTracks, {
	model_name: 'listoflists',
	init: function(opts, params) {
		this._super(opts);
		this.sub_pa_params = {
			vk_id: params.vk_id,
			for_current_user: params.for_current_user
		};
		this.initStates();
		this.initListedModels(['my', 'recommended']);
	},
	sub_pa: {
		'my': {
			constr: MyVkAudioList,
			getTitle: function() {
				return localize('vk-audio');
			}
		},
		'recommended':{
			constr: VkRecommendedTracks,
			title: "Recommended"
		}
	}
});

var LfmUserPreview = function() {};
BrowseMap.Model.extendTo(LfmUserPreview, {
	init: function(opts, params) {
		this._super(opts);
		var data = params.data;

		var song, song_time;
		var artist = spv.getTargetField(data, 'recenttrack.artist.name');
		if (artist){
			song = artist + ' - ' + spv.getTargetField(data, 'recenttrack.name');
			song_time = spv.getTargetField(data, 'recenttrack.@attr.uts');
			if (song_time){
				song_time = new Date(song_time * 1000);
			}
		}
		var image = this.app.art_images.getImageRewrap(data.lfm_image);

		spv.cloneObj(this.init_states, {
			selected_image: image,
			nav_title: data.username,
			username: data.username,
			registered: data.registered,

			gender: data.gender,
			lfm_image: image,
			big_desc: data.big_desc,
			song: song,
			song_time: song_time && song_time.toLocaleString(),
			song_time_raw: song_time,
			scrobbler: data.scrobblesource
		});
		this.initStates();
		this.rawdata = data;
	},
	showOnMap: function() {
		var md = this.app.getLastfmUser(this.state('username'));
		md.setProfileData(this.rawdata);
		md.showOnMap();
		//this.app.showLastfmUser(this.state('username'));
		//this.app.
	}
});
var VKFriendsList = function(){};
LoadableList.extendTo(VKFriendsList, {});

var LfmUsersList = function() {};
LoadableList.extendTo(LfmUsersList, {
	friendsParser: function(r, field_name) {
		var result = [];
		var array = spv.toRealArray(spv.getTargetField(r, field_name));
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			result.push(LfmFriendsList.parseUserInfo(cur));
			/*
			result.push({
				tag_name: array[i].name,
				count: array[i].count
			});*/
		}
		return result;
		//console.log(r);
	},
	itemConstr: LfmUserPreview,
	makeDataItem:function(data) {
		var item = new this.itemConstr();
		item.init({
			map_parent: this,
			app: this.app
		}, spv.cloneObj({
			data: data
		}, this.sub_pa_params));
		return item;
	},
	main_list_name: 'list_items',
	model_name: 'lfm_users',
	page_limit: 200
});

return {
	VkUserTracks: VkUserTracks,
	VKFriendsList: VKFriendsList
};
});