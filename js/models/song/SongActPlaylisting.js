define(['../invstg', '../comd', 'pv', 'spv'], function(invstg, comd, pv, spv) {
"use strict";
var SongActPlaylisting;

var playlistSuggest = spv.inh(invstg.BaseSuggest, {
	init: function(self, data) {
		self.pl = data.playlist;
		self.mo = data.mo;
		self.rpl = data.rpl;
		self.text_title = self.getTitle();
		pv.update(self, 'text_title', self.text_title);
	}
}, {
	valueOf: function(){
		return this.pl.state('nav_title');
	},
	onView: function(){
		this.pl.add(this.mo);
		this.rpl.hide();
	}
});

var PlaylistRSSection = spv.inh(invstg.SearchSection, {}, {
	resItem: playlistSuggest,
	model_name: "section-playlist"
});


var PlaylistRowSearch = spv.inh(invstg.Investigation, {
	init: function(self) {
		self.rpl = self.map_parent;
		self.mo = self.rpl.mo;
	}
}, {
	skip_map_init: true,
	'nest-section': [[PlaylistRSSection]],
	searchf: function() {
		var
			pl_results = [],
			pl_sec = this.g('section-playlist');
		if (!pl_sec) {
			return;
		}
		pl_sec.setActive();
		pl_sec.changeQuery(this.q);


		var serplr = this.app.getPlaylists(this.q);
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




SongActPlaylisting = function() {};
comd.BaseCRow.extendTo(SongActPlaylisting, {
	init: function(){
		this._super.apply(this, arguments);
		this.actionsrow = this.map_parent;
		this.mo = this.map_parent.map_parent;

		this.app.gena.on('child_change-lists_list', this.checkFullMatch, this.getContextOpts());
	},
	'nest-searcher': [PlaylistRowSearch],
	model_name: 'row-playlist-add',
	search: function(q) {
		pv.update(this, 'query', q);
		var searcher = this.getNesting('searcher');
		if (searcher) {
			searcher.changeQuery(q);
		}


		this.checkFullMatch();

	},

	checkFullMatch: function() {
		var current_query = this.state('query');
		pv.update(this, 'has_full_match', current_query && !!this.app.gena.matchTitleStrictly(current_query));
	},
	findAddPlaylist: function() {
		var current_query = this.state('query');
		if (current_query){
			this.app.gena.findAddPlaylist(current_query, this.mo);
		}
		this.hide();
		pv.update(this, 'query', '');
		this.getNesting('searcher').changeQuery('');
		this.checkFullMatch();
	}
});
return SongActPlaylisting;
});
