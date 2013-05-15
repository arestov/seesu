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
		this.username = params.lfm_username;
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

var LULAs = function() {};//artists, список артистов
LoadableList.extendTo(LULAs, {
	model_name: 'lulas',
	main_list_name: 'artists',
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		connectUsername.call(this, params);
	},
	subPager: function() {
		//artist
	},
	sub_pa: {
		
	},
	getRqData: function() {
		return {
			user: this.state('username')
		};
	},
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
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'library.getArtists',
			field_name: 'artists.artist',
			data: this.getRqData(),
			parser: function(r, field_name) {
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
			}
		});
	},
	'compx-has_no_access': no_access_compx
});

var TopLUArt = function() {};
LoadableList.extendTo(TopLUArt, {
	model_name: 'lulas',
	main_list_name: 'artists',
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
		this.sub_pa_params = {
			lfm_username: params.lfm_username,
			for_current_user: params.for_current_user
		};
		connectUsername.call(this, params);
	}
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
		//this.updateNesting('lists_list', [this.getSPI('library', true)]);
	},
	sub_pa: {
		'library': {
			constr: LULAs,
			title: 'library'
		},
		'top:7day': {
			constr: TopLUArt
		},
		'top:1month':{
			constr: TopLUArt
		},
		'top:3month':{
			constr: TopLUArt
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
	init: function(opts) {
		this._super(opts);
		this.initStates();
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

var LfmUserTags = function() {};
BrowseMap.Model.extendTo(LfmUserTags, {
	model_name: 'lfm_listened_tags',
	init: function(opts) {
		this._super(opts);
		this.initStates();
	}
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