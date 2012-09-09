var PlaylistAddRow;
(function() {
"use strict";
var playlistSuggest = function(data){
	this.init();
	this.pl = data.playlist;
	this.mo = data.mo;
	this.rpl = data.rpl;
	this.text_title = this.getTitle();
};
baseSuggest.extendTo(playlistSuggest, {
	valueOf: function(){
		return this.pl.playlist_title;
	},
	onView: function(){
		this.pl.add(this.mo);
		this.rpl.hide();
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

		pl_sec.appendResults(pl_results, true, true);
	}
});


var PlaylistAddRowUI = function() {};
BaseCRowUI.extendTo(PlaylistAddRowUI, {
	createDetailes: function(){
		var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
		this.c = parent_c.children('.addsong-to-playlist');
		this.button = buttons_panel.find('.pc-place .pc-add');
		this.bindClick();
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


		var searcher_ui = this.md.searcher.getFreeView(this);
		if (searcher_ui){
			this.addChild(searcher_ui);
			this.lpl.append(searcher_ui.getA());
			this.requestAll();
			searcher_ui.expand();
		//	searcher_ui.appended();
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

PlaylistAddRow = function(actionsrow, mo) {
	this.init(actionsrow, mo);
};
BaseCRow.extendTo(PlaylistAddRow, {
	init: function(actionsrow, mo){
		this.actionsrow = actionsrow;
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

