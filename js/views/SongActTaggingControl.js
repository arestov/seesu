define(['./etc_views', 'jquery', 'app_serv'], function(etc_views, $, app_serv){
"use strict";

var localize = app_serv.localize;

var LfmTagItView = function() {};
etc_views.LfmLoginView.extendTo(LfmTagItView, {
	createBase: function() {
		this._super();
		var _this = this;
		//

		var tpl_con = this.root_view.getSample('song-act-tagging');

		this.createTemplate(tpl_con);

		this.c.append(tpl_con);
		/*
		var wrap = $('<div class="add-to-lfmfav"></div>');

		this.nloveb = this.root_view.createNiceButton();
		this.nloveb.c.appendTo(wrap);
		this.nloveb.b.click(function(){
			if (_this.nloveb._enabled){
				_this.RPCLegacy('makeLove');
			}
		});
		this.addWayPoint(this.nloveb.b);
		this.nloveb.b.text(localize('addto-lfm-favs'));
		this.c.append(wrap);
		*/
	
	},
	"stch-has_session": function(state) {
		state = !!state;
		this.c.toggleClass('has_session', state);
		this.auth_block.toggleClass('hidden', state);
		/*
		
		
		
		this.nloveb.toggle(state);
		*/
	},
	"stch-wait_love_done": function(state){
		//this.c.toggleClass('wait_love_done', !!state);
	}
});



var SongActTaggingControl = function(){};
etc_views.BaseCRowUI.extendTo(SongActTaggingControl, {
	children_views: {
		lfm_tagsong: LfmTagItView
	},
	createDetails: function(){
		var parent_c = this.parent_view.row_context;
		var buttons_panel = this.parent_view.buttons_panel;
		this.c = parent_c.children('.song-tagging');
		this.button = buttons_panel.find('.pc-place .pc-tag');
		this.dom_related_props.push('button');

		this.bindClick();
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		this.c.append(this.getAFreeCV('lfm_tagsong'));
		this.requestAll();
	}
});
return SongActTaggingControl;

});