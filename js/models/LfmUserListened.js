define(['js/libs/BrowseMap', './LoadableList', 'spv', './SongsList'],
function(BrowseMap, LoadableList, spv, SongsList) {
"use strict";
//

var no_access_compx = {
	depends_on: ['username'],
	fn: function(username) {
		return !username;
	}
};

var connectUsername = function(params) {
	var _this = this;
	if (params.lfm_username){
		this.updateState('username', params.lfm_username);
	} else {
		if (params.for_current_user){
			this.app.on('state-change.lfm_username', function(e) {
				_this.updateState('username', e.value);
			});
		} else {
			throw new Error('only for current user or defined user');
		}
	}
};

//LULA - LfmUserLibraryArtist
//
var LULATracks = function() {};//непосредственно список композиций артиста, которые слушал пользователь
SongsList.extendTo(LULATracks, {
	init: function(opts, params) {
		this._super(opts);
		connectUsername.call(this, params);
		this.artist = params.artist;
		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('username'),
			artist: this.artist
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'library.getTracks',
			field_name: 'tracks.track',
			data: this.getRqData(),
			parser: this.getLastfmTracksList
		});
	},
	'compx-has_no_access': no_access_compx
});


var LULA = function() {};//artist, один артист с треками
BrowseMap.Model.extendTo(LULA, {
	model_name: 'lula',
	init: function(opts, params) {
		this._super(opts);
		var states = {};

		var artist = params.data.artist;
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user,
			artist: artist
		};
		connectUsername.call(this, params);
		spv.cloneObj(states, {
			'url_part': artist,
			'nav_title': artist,
			'artist_name': artist,
			'playcount': params.data.playcount,
			'lfm_image': this.app.art_images.getImageWrap(params.data.lfm_image.array)
		});
		this.updateManyStates(states);

		var all_time = this.getSPI('all_time', true);
		this.updateNesting('all_time', all_time);
	},
	'compx-has_no_access': no_access_compx,
	'compx-selected_image': {
		depends_on: ['lfm_image'],
		fn: function(lfm_i) {
			return lfm_i;
		}
	},
	sub_pa: {
		'all_time': {
			constr: LULATracks,
			title: 'All Time'
		}
	},
	subPager: function() {
		//daterange
	}
});


var UserArtists = function() {};
LoadableList.extendTo(UserArtists, {
	model_name: 'lulas',
	main_list_name: 'artists',
	makeDataItem:function(data) {
		var item = new LULA();
		item.init({
			map_parent: this,
			app: this.app
		}, spv.cloneObj({
			data: data
		}, this.sub_pa_params));
		return item;
	},
	artistListPlaycountParser: function(r, field_name) {
		var result = [];
		var array = spv.toRealArray(spv.getTargetField(r, field_name));
		for (var i = 0; i < array.length; i++) {
			result.push({
				artist: array[i].name,
				lfm_image: {
					array: array[i].image
				},
				playcount: array[i].playcount
			});
		}
		return result;
		//console.log(r);
	},
	'compx-has_no_access': no_access_compx
});

var LULAs = function() {};//artists, список артистов
UserArtists.extendTo(LULAs, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		connectUsername.call(this, params);
	},
	getRqData: function() {
		return {
			user: this.state('username')
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'library.getArtists',
			field_name: 'artists.artist',
			data: this.getRqData(),
			parser: this.artistListPlaycountParser
		});
	}
	
});

var TopLUArt = function() {};
UserArtists.extendTo(TopLUArt, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.timeword = this.init_opts[0].nav_opts.name_spaced;
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		connectUsername.call(this, params);
	},
	getRqData: function() {
		return {
			user: this.state('username'),
			period: this.timeword
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getTopArtists',
			field_name: 'topartists.artist',
			data: this.getRqData(),
			parser: this.artistListPlaycountParser
		});
	}
});


var TopUserTracks = function() {};
SongsList.extendTo(TopUserTracks, {
	init: function(opts, params) {
		this._super(opts);
		connectUsername.call(this, params);
		this.timeword = this.init_opts[0].nav_opts.name_spaced;
		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('username'),
			period: this.timeword
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getTopTracks',
			field_name: 'toptracks.track',
			data: this.getRqData(),
			parser: this.getLastfmTracksList
		});
	},
	'compx-has_no_access': no_access_compx
});

var LfmUserArtists = function() {};
BrowseMap.Model.extendTo(LfmUserArtists, {
	model_name: 'lfm_listened_artists',
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		this.updateNesting('library', this.getSPI('library', true));
		//this.updateNesting('week', this.getSPI('library', true));
		this.updateNesting('7day', this.getSPI('top:7day', true));
		this.updateNesting('1month', this.getSPI('top:1month', true));
		this.updateNesting('3month', this.getSPI('top:3month', true));
		this.updateNesting('lists_list', [
			this.getSPI('library', true),
			this.getSPI('top:7day', true),
			this.getSPI('top:1month', true),
			this.getSPI('top:3month', true)
		]);
	},
	sub_pa: {
		'library': {
			constr: LULAs,
			title: 'library'
		},
		'top:7day': {
			constr: TopLUArt,
			title: 'top of 7day'
		},
		'top:1month':{
			constr: TopLUArt,
			title: 'top of month'
		},
		'top:3month':{
			constr: TopLUArt,
			title: 'top of 3 months'
		}
		//артисты в библиотеке
		//недельный чарт
		//
		//лучшие за последние  7 днея, лучше за 3 месяца, полгода, год
		//недельные чарты - отрезки по 7 дней
	}
});

var LfmUserTracks = function() {};
BrowseMap.Model.extendTo(LfmUserTracks, {
	model_name: 'lfm_listened_tracks',
	init: function(opts, params) {
		this._super(opts);
		this.initStates();

		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};

		this.updateNesting('7day', this.getSPI('top:7day', true));
		this.updateNesting('1month', this.getSPI('top:1month', true));
		this.updateNesting('3month', this.getSPI('top:3month', true));

		this.updateNesting('lists_list', [
			this.getSPI('top:7day', true),
			this.getSPI('top:1month', true),
			this.getSPI('top:3month', true)
		]);
	},
	sub_pa: {
		'top:7day': {
			constr: TopUserTracks,
			title: 'top of 7day'
		},
		'top:1month':{
			constr: TopUserTracks,
			title: 'top of month'
		},
		'top:3month':{
			constr: TopUserTracks,
			title: 'top of 3 months'
		}
		//лучшие за последние  7 днея, лучше за 3 месяца, полгода, год
		//недельные чарты - отрезки по 7 дней
	}
});

var LfmUserAlbums = function() {};
BrowseMap.Model.extendTo(LfmUserAlbums, {
	model_name: 'lfm_listened_albums',
	init: function(opts) {
		this._super(opts);
		this.initStates();
	}
});



var TaggedSongs = function() {};
LoadableList.extendTo(TaggedSongs, {
	init: function(opts, params) {
		this._super(opts);

		this.tag_name = params.tag_name;
		connectUsername.call(this, params);

		this.initStates();
	},
	getRqData: function() {
		return {
			user: this.state('username'),
			taggingtype: 'track',
			tag: this.tag_name
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getPersonalTags',
			field_name: 'taggings.tracks.track',
			data: this.getRqData(),
			parser: this.getLastfmTracksList
		});
	},
	'compx-has_no_access': no_access_compx
});

var TaggedArtists = function() {};
LoadableList.extendTo(TaggedArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		
	}
});


var TaggedAlbums = function() {};
LoadableList.extendTo(TaggedAlbums, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	}
});

var UserTag = function() {};
BrowseMap.Model.extendTo(UserTag, {
	model_name: 'lfm_user_tag',
	init: function(opts, params) {
		this._super(opts);
		var tag_name = params.data.tag_name;
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user,
			tag_name: tag_name
		};
		spv.cloneObj(this.init_states, {
			tag_name: tag_name,
			count: params.data.count,
			nav_title: tag_name,
			url_part: tag_name
		});
		this.initStates();


		this.lists_list = ['artists', 'tracks', 'albums'];
		this.initSubPages(this.lists_list);

		this.updateNesting('lists_list', this.lists_list);
		this.updateNesting('preview_list', this.lists_list);
		this.bindChildrenPreload();
	},
	sub_pa: {
		'tracks': {
			constr: TaggedSongs,
			title: 'Tracks'
		},
		'artists': {
			constr: TaggedArtists,
			title: 'Artists'
		},
		'albums': {
			constr: TaggedAlbums,
			title: "Albums"
		}
	}
});

var LfmUserTags = function() {};
LoadableList.extendTo(LfmUserTags, {
	model_name: 'lfm_listened_tags',
	main_list_name: 'tags',
	init: function(opts, params) {
		this._super(opts);
		connectUsername.call(this, params);
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		this.initStates();
	},
	page_limit: 3000,
	getRqData: function() {
		return {
			user: this.state('username')
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'user.getTopTags',
			field_name: 'toptags.tag',
			data: this.getRqData(),
			parser: this.tagsParser
		});
	},
	
	makeDataItem:function(data) {
		var item = new UserTag();
		item.init({
			map_parent: this,
			app: this.app
		}, spv.cloneObj({
			data: data
		}, this.sub_pa_params));
		return item;
	},
	tagsParser: function(r, field_name) {
		var result = [];
		var array = spv.toRealArray(spv.getTargetField(r, field_name));
		for (var i = 0; i < array.length; i++) {
			result.push({
				tag_name: array[i].name,
				count: array[i].count
			});
		}
		return result;
		//console.log(r);
	},
	'compx-has_no_access': no_access_compx
});


var LfmUserListened = function() {};
BrowseMap.Model.extendTo(LfmUserListened, {
	init: function(opts, params) {
		this._super(opts);
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		
		this.initStates();
		this.lists_list = ['artists', 'tracks', 'tags', 'albums'];
		this.initSubPages(this.lists_list);

		this.updateNesting('lists_list', this.lists_list);
		this.updateNesting('preview_list', this.lists_list);
		this.bindChildrenPreload();
	},
	model_name: 'lfm_listened',
	sub_pa: {
		'artists': {
			constr: LfmUserArtists,
			title: 'Artists'
		},
		'tracks': {
			constr: LfmUserTracks,
			title: 'Tracks'
		},
		'tags': {
			constr: LfmUserTags,
			title: 'Tags'
		},
		'albums': {
			constr: LfmUserAlbums,
			title: 'Albums'
		}
	}
});
return LfmUserListened;
});