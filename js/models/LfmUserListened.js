define(['js/libs/BrowseMap'], function(BrowseMap) {
"use strict";
//

//LULA - LfmUserLibraryArtist
//
var LULATracks = function() {};
BrowseMap.Model.extendTo(LULATracks, {
	model_name: 'lula_tracks',
	init: function() {

	},
	subPager: function() {
		//daterange
	}
});


var LULA = function() {};//artist
BrowseMap.Model.extendTo(LULA, {
	model_name: 'lula',
	init: function() {

	},
	subPager: function() {
		//daterange
	}
});

var LULAs = function() {};//artists
BrowseMap.Model.extendTo(LULAs, {
	model_name: 'lulas',
	init: function(opts) {
		this._super(opts);
		this.initStates();
	},
	subPager: function() {
		//artist
	},
	sub_pa: {
		
	}
});

var LfmUserArtists = function() {};
BrowseMap.Model.extendTo(LfmUserArtists, {
	model_name: 'lfm_listened_artists',
	init: function(opts) {
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
	init: function(opts) {
		this._super(opts);
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