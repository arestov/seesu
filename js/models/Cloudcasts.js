define(['pv', 'spv', 'app_serv', 'js/libs/BrowseMap', './SongsList', './LoadableList'],
function(pv, spv, app_serv, BrowseMap, SongsList, LoadableList) {
"use strict";

//http://api.mixcloud.com/track/michael-jackson/smooth-criminal-acapella/?metadata=1
//Cloudcast
//CloudcastsList (extends PlaylistsList)
//limit and offset

var reg_replace_only_this_range = /[\u0000-\u0080]+/g;
var reg_replace = /[^a-zA-Z0-9_-]/g;
var replaceFunc = function(matched){
	return matched.replace(reg_replace, '');
};

var getMixcloudNameKey = function(string) {
	return string && string
		.toLowerCase()
		.replace(/\s/g, '-')
		.replace(reg_replace_only_this_range, replaceFunc)
		.replace(/-+/g, '-');

};

var Cloudcast = spv.inh(SongsList, {
	init: function(target, opts, params) {
		target.initStates(params);
		target.wch(target, 'mp_show', function(e) {
			if (e.value) {
				target.requestState('nav_title');
			}
		});
	}
}, {
	manual_states_init: true,
	network_data_as_states: false,
	req_map: [
		[
			['nav_title'],
			{
				props_map: {
					nav_title: 'name'
				}
			},
			['mixcloud', 'get', function() {
				return [this.state('key')];
			}]
		]
	],
	'nest_req-songs-list': [
		[{
			is_array: true,
			source: 'sections',
			props_map: {
				artist: 'track.artist.name',
				track: 'track.name'
			}
		}],
		['mixcloud', 'get', function() {
			return [this.state('key')];
		}]
	],
	addRawData: function(data) {
		pv.update(this, 'nav_title', data.nav_title);
	}

});



var CloudcastsList = spv.inh(LoadableList, {}, {
	'compx-artist_key': [
		['artist_name'],
		getMixcloudNameKey
	],
	'compx-track_key': [
		['track_name'],
		getMixcloudNameKey
	],
	model_name: 'cloudcasts_list',
	// init: function(opts, params) {
	// 	this._super.apply(this, arguments);
	// 	this.sub_pa_params = params;
	// 	this.initStates(params);
	// },
	makeDataItem: function(data) {
		var item = this.app.start_page.getSPI('cloudcasts/' + this.app.encodeURLPart(data.key), true);
		item.addRawData(data);
		return item;
	},
	'nest_req-lists_list': [
		[{
			is_array: true,
			source: 'data',
			props_map: {
				nav_title: 'name',
				key: 'key'
			}
		}, true],
		['mixcloud', 'get', function() {
			return [['track', this.state('artist_key'), this.state('track_key'), this.tcl_type].join('/') + '/', null];
		}]
	]

});


var TrackCloudcastsNew = spv.inh(CloudcastsList, {}, {
	tcl_type: 'new'
});
var TrackCloudcastsPopular = spv.inh(CloudcastsList, {}, {
	tcl_type: 'popular'
});
var TrackCloudcastsHot = spv.inh(CloudcastsList, {}, {
	tcl_type: 'hot'
});


var song_cloudcasts_sps = ['new', 'hot', 'popular'];
var SongcardCloudcasts = spv.inh(BrowseMap.Model, {}, {
	// init: function(opts, data) {
	// 	this._super.apply(this, arguments);

	// 	var sub_pa_params = {};
	// 	spv.cloneObj(sub_pa_params, data);
	// 	spv.cloneObj(sub_pa_params, {
	// 		artist_key: getMixcloudNameKey(data.artist_name),
	// 		track_key: getMixcloudNameKey(data.track_name)
	// 	});
	// 	this.sub_pa_params = sub_pa_params;
	// 	this.initStates(data);
	// },
	'nest-lists_list': [song_cloudcasts_sps, {
		preload_on: 'mp_has_focus'
	}],
	model_name: 'songcard_cloudcasts',
	sub_page: {
		'new': {
			constr: TrackCloudcastsNew,
			title: [null, 'New']
		},
		'hot': {
			constr: TrackCloudcastsHot,
			title: [null, 'Hot']
		},
		'popular': {
			constr: TrackCloudcastsPopular,
			title: [null, 'Popular']
		},
	}
});
Cloudcast.SongcardCloudcasts = SongcardCloudcasts;
return Cloudcast;

});
