define(['provoda', 'jquery', 'app_serv'], function(provoda, $, app_serv) {
"use strict";
var localize = app_serv.localize;
provoda.addPrototype("SongsListViewBase", {
	state_change: {
		'list_loading': function(loading){
			if (loading){
				this.lc.addClass('loading');
			} else {
				this.lc.removeClass('loading');
			}
		},
		"more_load_available": function(state) {
			
			if (state){
				this.requirePart("load-more-b").removeClass("hidden");
			} else {
				var button = this.getPart("load-more-b");
				if (button){
					button.addClass("hidden");
				}
			}
		},
		"can_play": function(state) {
			if (state){
				//make-trs-plable
				this.c.addClass('has-files-in-songs');
			} else {
				this.c.removeClass('has-files-in-songs');
			}
		}
	},
	dom_rp: true,
	parts_builder: {
		"load-more-b": function() {
			var _this = this;
			var node = $("<a class='load-more-list-data'></a>").click(function() {
				_this.RPCLegacy('requestMoreData', true);
			}).text(localize("load-more")).appendTo(this.c);

			this.addWayPoint(node, {
				canUse: function() {
					return _this.state('more_load_available');
				}
			});
			
			return node;
		}
	},
	createListBase: function() {
		this.lc = $('<ul class="tracks-for-play list-overview"></ul>').appendTo(this.c);
		this.dom_related_props.push('lc');
	},
	createBase: function() {
		this.c = $('<div class="playlist-container"></div>');
		if (this.createPanel){
			this.createPanel();
		}
		this.createListBase();

	},
	'collch-songs-list': {
		place: 'lc',
		space: 'main',
		opts: function(){
			return {lite: this.opts && this.opts.overview};
		}
	},
	'coll-prio-songs-list': function(array) {
		var viewing = [], prev_next = [], play = [], others = [];
		for (var i = array.length - 1; i >= 0; i--) {
			var cur = array[i];
			//.mpx
			var states = cur.states;
			if (states.mp_show){
				viewing.push(cur);
			} else if (states.marked_as){
				prev_next.push(cur);
			} else if (states.player_song){
				play.push(cur);
			} else {
				others.push(cur);
			}
		}
		var result = [];
		if (viewing.length){
			result.push(viewing);
		}
		if (prev_next.length){
			result.push(prev_next);
		}
		if (play.length){
			result.push(play);
		}
		if (others.length){
			result.push(others);
		}
		return result;
		/*
		player_song
		marked_as
		mp_show*/
		
	}
});
return {};
});