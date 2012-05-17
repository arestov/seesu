var ShareRow;
(function(){
"use strict";




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


