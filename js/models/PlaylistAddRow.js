define(['./invstg', './comd'], function(invstg, comd) {
"use strict";
var PlaylistAddRow;


var playlistSuggest = function(data){
	this.init();
	this.pl = data.playlist;
	this.mo = data.mo;
	this.rpl = data.rpl;
	this.text_title = this.getTitle();
};
invstg.BaseSuggest.extendTo(playlistSuggest, {
	valueOf: function(){
		return this.pl.playlist_title;
	},
	onView: function(){
		this.pl.add(this.mo);
		this.rpl.hide();
	}
});


var PlaylistRSSection = function() {
	this.init();
};
invstg.SearchSection.extendTo(PlaylistRSSection, {
	resItem: playlistSuggest,
	model_name: "section-playlist"
});


var PlaylistRowSearch = function(rpl, mo) {
	this.init(rpl, mo);
};
invstg.Investigation.extendTo(PlaylistRowSearch, {
	skip_map_init: true,
	init: function(rpl, mo) {
		this._super();
		this.rpl = rpl;
		this.mo = mo;
		this.addSection('playlists', new PlaylistRSSection());
	},
	searchf: function() {
		var
			pl_results = [],
			pl_sec = this.g('playlists');

		pl_sec.setActive();
		pl_sec.changeQuery(this.q);


		var serplr = su.getPlaylists(this.q);
		if (serplr.length){
			for (var i = 0; i < serplr.length; i++) {
				pl_results.push({
					playlist: serplr[i],
					mo: this.mo,
					rpl: this.rpl
				});
			}
		}

		pl_sec.appendResults(pl_results, true, true);
	}
});




PlaylistAddRow = function(actionsrow, mo) {
	this.init(actionsrow, mo);
};
comd.BaseCRow.extendTo(PlaylistAddRow, {
	init: function(actionsrow, mo){
		this.actionsrow = actionsrow;
		this.mo = mo;
		this._super();
		this.searcher = new PlaylistRowSearch(this, mo);
		this.updateNesting('searcher', this.searcher);
	},
	model_name: 'row-playlist-add',
	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
	},
	findAddPlaylist: function() {
		var current_query = this.state('query');
		if (current_query){
			su.gena.findAddPlaylist(current_query, this.mo);
		}
		this.hide();
	}
});
return PlaylistAddRow;
});