define(['./invstg', './comd'], function(invstg, comd) {
"use strict";
var SongActPlaylisting;


var playlistSuggest = function(data){
	this.init();
	this.pl = data.playlist;
	this.mo = data.mo;
	this.rpl = data.rpl;
	this.text_title = this.getTitle();
	this.updateState('text_title', this.text_title);
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




SongActPlaylisting = function(actionsrow, mo) {
	this.init(actionsrow, mo);
};
comd.BaseCRow.extendTo(SongActPlaylisting, {
	init: function(actionsrow, mo){
		this.actionsrow = actionsrow;
		this.app = mo.app;
		this.mo = mo;
		this._super();
		this.searcher = new PlaylistRowSearch(this, mo);
		this.updateNesting('searcher', this.searcher);
		this.mo.app.gena.on('child-change.lists_list', this.checkFullMatch, this.getContextOpts());
	},
	model_name: 'row-playlist-add',
	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
		this.checkFullMatch();

	},
	'compx-need_creation_button':{
		depends_on: ['query', 'has_full_match'],
		fn: function(query, has_full_match) {
			return query && !has_full_match;
		}
	},
	checkFullMatch: function() {
		var current_query = this.state('query');
		this.updateState('has_full_match', current_query && !!this.app.gena.matchTitleStrictly(current_query));
	},
	findAddPlaylist: function() {
		var current_query = this.state('query');
		if (current_query){
			this.app.gena.findAddPlaylist(current_query, this.mo);
		}
		this.hide();
		this.updateState('query', '');
		this.searcher.changeQuery('');
		this.checkFullMatch();
	}
});
return SongActPlaylisting;
});