var PlaylistAddRow;
(function() {
"use strict";
var playlistSuggest = function(data){
	this.init();
	this.pl = data.playlist;
	this.mo = data.mo;
	this.rpl = data.rpl;

};
baseSuggest.extendTo(playlistSuggest, {
	valueOf: function(){
		return this.pl.playlist_title;
	},
	onView: function(){
		this.pl.add(this.mo);
		this.rpl.hide();
		//su.views.showStaticPlaylist(this.pl, true);
	},
	ui_constr: baseSuggestUI
});


var PlaylistRSSection = function() {
	this.init();
};
searchSection.extendTo(PlaylistRSSection, {
	resItem: playlistSuggest,
	ui_constr: searchSectionUI
});


var PlaylistRowSearch = function(rpl, mo) {
	this.init(rpl, mo);
};
investigation.extendTo(PlaylistRowSearch, {
	init: function(rpl, mo) {
		this._super();
		this.rpl = rpl;
		this.mo = mo;
		this.addSection('playlists', new PlaylistRSSection());
	},
	ui_constr: investigationUI,
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

		pl_sec.appendResults(pl_results);
		pl_sec.renderSuggests(true);
	}
});


var PlaylistAddRowUI = function() {};
BaseCRowUI.extendTo(PlaylistAddRowUI, {
	init: function(md, parent_c, buttons_panel){
		this.md = md;
		this._super();
		this.c = parent_c.children('.addsong-to-playlist');
		this.button = buttons_panel.find('.pc-place .pc-add');
		this.bindClick();
		this.setModel(md);

	},
	expand: function() {
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		

		var _this = this;
		var inputSearch = debounce(function(e) {
			_this.md.search(this.value);
		}, 100);
		this.input = this.c.find('.playlist-query').bind('keyup change search mousemove', inputSearch);

		this.lpl = $('<div class="list-of-playlists"></div>').appendTo(this.c);


		this.pl_creation_b = $("<div class='create-named-playlist hidden suggest'></div>").click(function() {
			_this.md.createPlaylist();
		});
		this.pl_creation_b_text = $('<span></span>');
		this.pl_creation_b.append(localize("cr-new-playlist") + ' "').append(this.pl_creation_b_text).append('"');
		this.lpl.append(this.pl_creation_b);


		var searcher_ui = this.md.searcher.getFreeView();
		if (searcher_ui){
			this.lpl.append(searcher_ui.getC());
			searcher_ui.expand();
			searcher_ui.appended();
		}
		this.md.search("");

		

		
	},
	state_change: {
		'active_view': function(state){
			if (state){
				this.expand();
				this.c.removeClass('hidden');
				var inp = this.input[0];
				setTimeout(function() {
					inp.focus();
				}, 100);
				
			} else {
				this.c.addClass('hidden');
			}
		},
		query: function(state) {
			if (this.pl_creation_b){
				if (state){
					this.pl_creation_b_text.text(state);
					this.pl_creation_b.removeClass('hidden');
				} else {
					this.pl_creation_b.addClass('hidden');
				}
			}
			
		}
	}
});

PlaylistAddRow = function(traackrow, mo) {
	this.init(traackrow, mo);
};
BaseCRow.extendTo(PlaylistAddRow, {
	init: function(traackrow, mo){
		this.traackrow = traackrow;
		this.mo = mo;
		this._super();
		this.searcher = new PlaylistRowSearch(this, mo);
		this.addChild(this.searcher);
	},
	row_name: 'playlist-add',
	ui_constr: PlaylistAddRowUI,
	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
	},
	createPlaylist: function() {
		var current_query = this.state('query');
		if (current_query){
			su.gena.create_userplaylist(current_query).add(this.mo);
		}
		this.hide();
	}
});
//su.gena.create_userplaylist(searching_for).add(current_song);
//playlist.add(song);

})();

