define(['./etc_views', 'jquery', 'app_serv', 'spv', 'pv'], function(etc_views, $, app_serv, spv, pv){
"use strict";

//var localize = app_serv.localize;


var addTag = function(e, node, scope) {
	e.preventDefault();
	this.RPCLegacy('addTag', scope.tag.name || scope.tag);
};

var LfmTagItView = spv.inh(etc_views.LfmLoginView, {}, {
	createBase: function() {
		this._super();
	//	var _this = this;
		//

		var tpl_con = this.root_view.getSample('song-act-tagging');

		this.tpl = this.createTemplate(tpl_con);

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
	tpl_r_events: {
		'petags_result': {
			addTag: addTag
		},
		'toptags': {
			addTag: addTag
		},
		'artist_tags': {
			addTag: addTag
		}
	},

	tpl_events:{
		changeTags: spv.debounce(function(e, input) {
			//shared debounce! fixme? одна функция рассеивает вызовы которые могут относится к разным объектам
			var value = input.value;
			this.overrideStateSilently('user_tags_string', value);
			this.RPCLegacy('changeTags', value);
			//console.log(arguments);
		})
	},
	"stch-user_tags_string": function(target, state) {
		target.tpl.ancs['tags-input'].val(state);
	},
	"stch-has_session": function(target, state) {
		state = !!state;
		target.c.toggleClass('has_session', state);
		target.auth_block.toggleClass('hidden', state);
		/*



		target.nloveb.toggle(state);
		*/
	},
	// "stch-wait_love_done": function(target){
	// 	//target.c.toggleClass('wait_love_done', !!state);
	// }
});



var SongActTaggingControl = spv.inh(pv.View, {}, {
	children_views: {
		lfm_tagsong: LfmTagItView
	},
	'collch-$ondemand-lfm_tagsong': {
		place: 'c',
		needs_expand_state: 'active_view'
	}
});
return SongActTaggingControl;

});
