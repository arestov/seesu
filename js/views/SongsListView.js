define(['provoda', 'jquery', './SongUI', './etc_views', ],
function(provoda, $, SongUI, etc_views) {
	"use strict";
	var PlaylistSettingsRowView = function(){};
	provoda.View.extendTo(PlaylistSettingsRowView, {
		"stch-dont_rept_pl": function(state) {
			this.dont_rept_pl_chbx.prop('checked', !!state);
		},
		bindBase: function() {
			var _this = this;
			this.dont_rept_pl_chbx = this.tpl.ancs['dont-rept-pl'].click(function() {
				_this.RPCLegacy('setDnRp', $(this).prop('checked'));
			});

		}
	});

	var PlARowView = function() {};
	etc_views.ActionsRowUI.extendTo(PlARowView, {

		canUseWaypoints: function() {
			return this.parent_view.state('mp_has_focus');
		},
		children_views: {
			"row-multiatcs": provoda.View,
			"row-pl-settings": PlaylistSettingsRowView
		}
	});

	var SongsListViewBase = function() {};
	provoda.View.extendTo(SongsListViewBase, {
		createBase: function() {
			this.setVisState('overview', this.opts && this.opts.overview);
			this.c = this.root_view.getSample('playlist-container');
			if (this.opts && this.opts.overview){
				this.c.prepend(this.root_view.getSample('playlist_panel'));
			}
			this.createTemplate();
			
		},
		'collch-songs-list': {
			place: 'tpl.ancs.lc',
			space: 'main',
			opts: function(){
				return {lite: this.opts && this.opts.overview};
			}
		},
		'coll-prio-songs-list': function(array) {
			var viewing = [], prev_next = [], play = [];//, others = [];
			for (var i = array.length - 1; i >= 0; i--) {
				var cur = array[i];
				var states = cur.states;
				if (states.mp_show || states.mpl_attached){
					viewing.push(cur);
				} else if (states.marked_as){
					prev_next.push(cur);
				} else if (states.player_song){
					play.push(cur);
				} /*else {
				//	others.push(cur);
				}*/
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
			/*if (others.length){
				result.push(others);
			}*/
			return result;
			/*
			player_song
			marked_as
			vmp_show*/
			
		}
	});
	var SongsListView = function(){};
	SongsListViewBase.extendTo(SongsListView, {
		children_views: {
			plarow: PlARowView,
			'songs-list': SongUI.SongViewLite
		}
	});
	var SongsListDetailedView = function() {};
	SongsListViewBase.extendTo(SongsListDetailedView, {
		children_views: {
			plarow: PlARowView,
			'songs-list': SongUI
		}
	});

	SongsListView.SongsListDetailedView = SongsListDetailedView;

return SongsListView;
});