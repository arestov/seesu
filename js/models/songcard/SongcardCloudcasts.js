define(['spv', 'app_serv', 'js/libs/BrowseMap', '../SongsList', '../LoadableList'],
function(spv, app_serv, BrowseMap, SongsList, LoadableList) {
"use strict";
var localize = app_serv.localize;

//http://api.mixcloud.com/track/michael-jackson/smooth-criminal-acapella/?metadata=1
//Cloudcast
//CloudcastsList (extends PlaylistsList)
//limit and offset



var Cloudcast = function() {};
SongsList.extendTo(Cloudcast, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.initStates(params);
	},
	datamorph_map: new spv.MorphMap({
		source: 'sections',
		props_map: {
			artist: 'track.artist.name',
			track: 'track.name'
		}
	}),
	getRqData: function() {
		return this.state('key');
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		//var _this = this;

		request_info.request = $.ajax({
			url: 'https://api.mixcloud.com/' + this.getRqData(),
			dataType: "json",
			context: this
		})
			.done(function(r){
				var list = this.datamorph_map.execute(r);
				this.putRequestedData(request_info.request, list, r.error);
				if (!r.error) {
					this.setLoaderFinish();
				}
			});
			
	}

});

var TrackCloudcastsList = function() {};
LoadableList.extendTo(TrackCloudcastsList, {
	model_name: 'cloudcasts_list',
	init: function(opts, params) {
		this._super(opts);
		this.sub_pa_params = params;
		this.initStates(params);
	},
	subitemConstr: Cloudcast,
	datamorph_map: new spv.MorphMap({
		source: 'data',
		props_map: {
			nav_title: 'name',
			key: 'key'
		}
	}),
	getRqData: function() {
		return ['track', this.state('artist_key'), this.state('track_key'), this.tcl_type].join('/') + '/';
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		var _this = this;

		request_info.request = $.ajax({
			url: 'https://api.mixcloud.com/' + this.getRqData(),
			dataType: "json",
			context: this
		})
			.done(function(r){
				var list = this.datamorph_map.execute(r);
				this.putRequestedData(request_info.request, list, r.error);
			});
			
	}

});


var TrackCloudcastsNew = function() {};
TrackCloudcastsList.extendTo(TrackCloudcastsNew, {
	tcl_type: 'new'
});
var TrackCloudcastsPopular = function() {};
TrackCloudcastsList.extendTo(TrackCloudcastsPopular, {
	tcl_type: 'popular'
});
var TrackCloudcastsHot = function() {};
TrackCloudcastsList.extendTo(TrackCloudcastsHot, {
	tcl_type: 'hot'
});



var reg_replace_only_this_range = /[\u0000-\u0080]+/g;
var reg_replace = /[^a-zA-Z0-9_-]/g;
var replaceFunc = function(matched){
	return matched.replace(reg_replace, '');
};

var getMixcloudNameKey = function(string) {
	return string
		.toLowerCase()
		.replace(/\s/g, '-')
		.replace(reg_replace_only_this_range, replaceFunc)
		.replace(/-+/g, '-');

};

var SongcardCloudcasts = function() {};
BrowseMap.Model.extendTo(SongcardCloudcasts, {
	init: function(opts, params) {
		this._super(opts);

		var sub_pa_params = {};
		spv.cloneObj(sub_pa_params, params);
		spv.cloneObj(sub_pa_params, {
			artist_key: getMixcloudNameKey(params.artist_name),
			track_key: getMixcloudNameKey(params.track_name)
		});

		this.sub_pa_params = sub_pa_params;

		this.initStates(params);




		this.lists_list = ['new', 'hot', 'popular'];
		this.initSubPages(this.lists_list);

		//this.initItems(this.lists_list, {app:this.app, map_parent:this}, {tag_name:this.tag_name});

		this.updateNesting('lists_list', this.lists_list);
		this.bindChildrenPreload();

		//this.tag_name = params.tag_name;
	},
	model_name: 'songcard_cloudcasts',
	sub_pa: {
		'new': {
			constr: TrackCloudcastsNew,
			title: 'New'
		},
		'hot': {
			constr: TrackCloudcastsHot,
			title: 'Hot'
		},
		'popular': {
			constr: TrackCloudcastsPopular,
			title: 'Popular'
		},
	}
});
return SongcardCloudcasts;

});