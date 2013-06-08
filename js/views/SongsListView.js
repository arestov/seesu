define(['provoda', 'jquery', './SongUI', './etc_views', 'app_serv'],
function(provoda, $, SongUI, etc_views, app_serv) {
	"use strict";
	var localize = app_serv.localize;
	var PlaylistSettingsRowView = function(){};
	etc_views.BaseCRowUI.extendTo(PlaylistSettingsRowView, {
		"stch-dont_rept_pl": function(state) {
			this.dont_rept_pl_chbx.prop('checked', !!state);
		},
		createDetailes: function(){
			var parent_c = this.parent_view.row_context;
			var buttons_panel = this.parent_view.buttons_panel;
			this.c =  parent_c.children('.pla-settings');
			this.button = buttons_panel.children('.pl-settings-button');

			this.bindClick();
			//var _this = this;
			var _this = this;

			this.dont_rept_pl_chbx = this.c.find('.dont-rept-pl input').click(function() {
				_this.RPCLegacy('setDnRp', $(this).prop('checked'));
			});
		}
	});


	var MultiAtcsRowView = function(){};
	etc_views.BaseCRowUI.extendTo(MultiAtcsRowView, {
		createDetailes: function(){
			var parent_c = this.parent_view.row_context;
			var buttons_panel = this.parent_view.buttons_panel;
			this.c =  parent_c.children('.pla-row');
			this.button = buttons_panel.children('.pla-button');


			var _this = this;

			this.c.find(".search-music-files").click(function(){
				_this.RPCLegacy('makePlayable');
				
				//
			});

			this.c.find('.open-external-playlist').click(function(){
				_this.RPCLegacy('makeExternalPlaylist');
			
				//e.preventDefault();
			});


			this.bindClick();
		}
	});



	var PlARowView = function() {};
	etc_views.ActionsRowUI.extendTo(PlARowView, {
		createBase: function(){
		//	var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
			this.c = this.parent_view.tpl.ancs.panel;
			this.row_context = this.c.find('.pla-row-content');
			this.arrow = this.row_context.children('.rc-arrow');
			this.buttons_panel = this.c.children().children('.pla-panel');
		},
		canUseWaypoints: function() {
			return this.parent_view.state('mp_has_focus');
		},
		children_views: {
			"row-multiatcs": {
				main: MultiAtcsRowView
			},
			"row-pl-settings": {
				main: PlaylistSettingsRowView
			}
		}
	});



	var SongsListView = function(){};
	provoda.View.extendTo(SongsListView, {
		createBase: function() {
			this.setVisState('overview', this.opts && this.opts.overview);
			this.c = this.root_view.getSample('playlist-container');
			if (this.opts && this.opts.overview){
				this.c.prepend(this.root_view.getSample('playlist_panel'));
			}
			this.createTemplate();
			
		},
		
		'collch-plarow': function(name, md) {
			if (!this.tpl.ancs.panel){
				return;
			}
			var view = this.getFreeChildView({name: name, space: 'main'}, md, {lite: this.opts && this.opts.overview});
			this.requestAll();
		},
		children_views: {
			plarow: {
				main: PlARowView
			},
			'songs-list': SongUI
		},
		'collch-songs-list': {
			place: 'tpl.ancs.lc',
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
				if (states.mp_show || states.mpl_attached){
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

return SongsListView;
});