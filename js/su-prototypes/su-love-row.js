var LoveRow;
(function(){
"use strict";



var LoveRowUI = function(){};
BaseCRowUI.extendTo(LoveRowUI, {
	createDetailes: function(){
	var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
		this.c = parent_c.children('.love-song');
		this.button = buttons_panel.find('.pc-place .pc-love');

		this.bindClick();
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		var llit_view = this.md.lfm_loveit.getFreeView(this);
		this.c.append(llit_view.getA());
		//llit_view.appended();
		this.addChild(llit_view);
		this.requestAll();

		
	}
});

LoveRow = function(actionsrow, mo){
	this.init(actionsrow, mo);
};
BaseCRow.extendTo(LoveRow, {
	init: function(actionsrow, mo){
		var _this = this;
		this.actionsrow = actionsrow;
		this.mo = mo;
		this._super();
		this.lfm_loveit = new LfmLoveIt(su.lfm_auth, this.mo);
		this.lfm_loveit.on('love-success', function() {
			_this.hide();
		});
		this.addChild(this.lfm_loveit);
		
	},
	row_name: 'love',
	ui_constr: LoveRowUI
});
})()


