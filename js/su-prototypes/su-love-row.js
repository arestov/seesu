var LoveRow;
(function(){
"use strict";



var LoveRowUI = function(){};
BaseCRowUI.extendTo(LoveRowUI, {
	init: function(md, parent_c, buttons_panel){
		this.md = md;
		this._super();
		this.c = parent_c.children('.love-song');
		this.button = buttons_panel.find('.pc-place .pc-love');
		
		


		this.bindClick();
		this.setModel(md);
	},
	state_change: cloneObj(cloneObj({},BaseCRowUI.prototype.state_change), {
		"share-url": {
			fn: function(state){
				this.getPart("share_input").val(state || "")
			//	dep_vp
			},
			dep_vp: ['share_input']
		}
		

	}),
	parts_builder: {
		share_input: function(){
			var share_input = this.c.find('.song-link');
			share_input.bind("click focus", function() {
				this.select();
			});
			return share_input;
		}
	},
	addWSChunk: function() {
		return $(document.createTextNode("")).appendTo(this.users_c);
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		return;
		var _this = this;

		this.requirePart("share_input");
		
		/*
		this.share_input = this.c.find('.song-link').val();
		this.share_input.bind("click focus", function() {
			this.select();
		});
*/		
		this.requirePart("pch-ws-input");
		this.requirePart("pch-ws-own");
		this.requirePart("pch-vk-auth");
		this.requirePart("pch-ws-friends");
		

		
	}
});

LoveRow = function(traackrow, mo){
	this.init(traackrow, mo);
};
BaseCRow.extendTo(LoveRow, {
	init: function(traackrow, mo){
		var _this = this;
		this.traackrow = traackrow;
		this.mo = mo;
		this._super();
		
		
	},
	row_name: 'love',
	ui_constr: LoveRowUI
});
})()


