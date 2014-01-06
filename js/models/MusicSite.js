define(['spv', 'js/libs/BrowseMap', '../SongsList', '../LoadableList'],
function(spv, BrowseMap, SongsList, LoadableList) {
"use strict";
var MusicSite = function() {};
BrowseMap.Model.extendTo(MusicSite, {
	init: function(opts, params) {
		this._super(opts);

		this.initStates(params);

	}
});

var FeaturedSites = function() {};
LoadableList.extendTo(FeaturedSites, {
	init: function(opts) {
		this._super(opts);
	}
});

var TrendedSites = function() {};
LoadableList.extendTo(TrendedSites, {
	init: function(opts) {
		this._super(opts);
	},
	subitemConstr: MusicSite,
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

//http://ex.fm/api/v3/sotd
//http://ex.fm/api/v3/site/featured

//http://ex.fm/api/v3/site/awesometapes.com
//http://ex.fm/api/v3/site/awesometapes.com/songs
MusicSite.FeaturedSites = FeaturedSites;
MusicSite.TrendedSites = TrendedSites;

return MusicSite;

});