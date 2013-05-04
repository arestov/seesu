define(['js/libs/BrowseMap'], function(BrowseMap) {
"use strict";
//

var LfmUserLibraryArtists = function() {};
BrowseMap.Model.extendTo(LfmUserLibraryArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	},
	sub_pa: {
		
	}
});

var LfmUserArtists = function() {};
BrowseMap.Model.extendTo(LfmUserArtists, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	},
	sub_pa: {
		//артисты в библиотеке
		//недельный чарт
		//
		//лучшие за последние  7 днея, лучше за 3 месяца, полгода, год
		//недельные чарты - отрезки по 7 дней
	}
});

var LfmUserTracks = function() {};
BrowseMap.Model.extendTo(LfmUserTracks, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	}
});

var LfmUserAlbums = function() {};
BrowseMap.Model.extendTo(LfmUserAlbums, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	}
});

var LfmUserTags = function() {};
BrowseMap.Model.extendTo(LfmUserTags, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	}
});


var LfmUserListened = function() {};
BrowseMap.Model.extendTo(LfmUserListened, {
	init: function(opts, params) {
		this._super(opts);
		this.initStates();
	},
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