define(function(require) {
'use strict';
var etc_views = require('./etc_views');
var spv = require('spv');
var View = require('View');

var addTag = function(e, node, scope) {
	e.preventDefault();
	this.RPCLegacy('addTag', scope.tag.name || scope.tag);
};

var LfmTagItView = spv.inh(etc_views.LfmLoginView, {}, {
	createBase: function() {
		this._super();

		var tpl_con = this.root_view.getSample('song-act-tagging');

		this.tpl = this.createTemplate(tpl_con);

		this.c.append(tpl_con);
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



var SongActTaggingControl = spv.inh(View, {}, {
	children_views: {
		lfm_tagsong: LfmTagItView
	},
	'collch-lfm_tagsong': 'c',
});
return SongActTaggingControl;

});
