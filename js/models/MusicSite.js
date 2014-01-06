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
	}
});

});