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


