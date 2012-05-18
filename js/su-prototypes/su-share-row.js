var ShareRow;
(function(){
"use strict";
var struserSuggest = function(data) {
	this.init();
	this.user_id = data.id;
	this.photo = data.photo;
	this.online = this.online;
	this.name = data.name;
};
baseSuggest.extendTo(struserSuggest, {
	valueOf: function(){
		return this.id;
	},
	onView: function(){
		//this.pl.add(this.mo);
		//this.rpl.hide();
		//su.views.showStaticPlaylist(this.pl, true);
	},
	ui_constr: baseSuggestUI
});


var StrusersRSSection = function() {
	this.init();
};
searchSection.extendTo(StrusersRSSection, {
	resItem: struserSuggest,
	ui_constr: searchSectionUI
});


var StrusersRowSearch = function(rpl, mo) {
	this.init(rpl, mo);
};
investigation.extendTo(StrusersRowSearch, {
	init: function(rpl, mo) {
		this._super();
		this.rpl = rpl;
		this.mo = mo;
		this.addSection('users', new StrusersRSSection());
	},
	ui_constr: investigationUI,
	searchf: function() {
		var
			pl_results = [],
			pl_sec = this.g('users');

		pl_sec.setActive();
		pl_sec.changeQuery(this.q);
		/*

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
		*/
	}
});





var ShareRowUI = function(){};
BaseCRowUI.extendTo(ShareRowUI, {
	init: function(md, parent_c, buttons_panel){
		this.md = md;
		this._super();
		this.c = parent_c.children('.share-song');
		this.button = buttons_panel.find('.pc-place .pc-rupor');
		
		this.bindClick();
		this.setModel(md);
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		this.share_input = this.c.find('.song-link').val(Math.random());
	}
});

ShareRow = function(traackrow){
	this.init(traackrow);
};
BaseCRow.extendTo(ShareRow, {
	init: function(traackrow){
		this.traackrow = traackrow;
		this._super();
	},
	row_name: 'share',
	ui_constr: ShareRowUI
});
})()


