define(['provoda', 'spv', 'jquery', 'app_serv',
'./SongActionsRowUI', './MfCorUI', './ArtcardUI', './SongcardPage', './coct'],
function(provoda, spv, $, app_serv,
SongActionsRowUI, MfCorUI, ArtcardUI, SongcardPage, coct) {
"use strict";

var SongViewBase = function() {};
coct.SPView.extendTo(SongViewBase, {
	tpl_events: {
		showSong: function(e) {
			e.preventDefault();
			if (this.expand) {
				this.expand();
			}
			
			this.RPCLegacy('wantSong');
			this.RPCLegacy('requestPage');

		}
	}
});

var SongUI = function(){};

SongViewBase.extendTo(SongUI, {
	canUseDeepWaypoints: function() {
		return !!this.state('vmp_show');
	},
	dom_rp: true,
	state_change : {
		"vmp_show": function(opts, old_opts) {
			if (opts){
			//	this.parent_view.c.addClass("show-zoom-to-track");
				this.activate();
			} else if (old_opts) {
			//	this.parent_view.c.removeClass("show-zoom-to-track");
				this.deactivate();
			}
		}
	},
	'compx-must_expand': [
		['can_expand', 'vmp_show', 'vis_can_expand'],
		function(can_expand, vmp_show, vis_can_expand) {
			return can_expand || vmp_show || vis_can_expand;
		}
	],
	deactivate: function(){

		var acts_row = this.getMdChild('actionsrow');
		if (acts_row) {
			acts_row.hideAll();
		}

		this.getMdChild('mf_cor').collapseExpanders();
	},
	children_views: {
		actionsrow: SongActionsRowUI,
		mf_cor: MfCorUI,
		artist: ArtcardUI.ArtistInSongConstroller,
		songcard: SongcardPage.SongcardController
	},
	activate: function(){
		
	},
	parts_builder: {
		context: function() {
			return this.root_view.getSample('track_c');
		},
		mf_cor_con: function() {
			var context = this.requirePart('context');
			var div = $('<div></div>');
			context.prepend(div);
			return div;
		}
	},
	'collch-$ondemand-actionsrow': {
		place: true,
		needs_expand_state: 'must_expand'
	},
	'collch-$ondemand-mf_cor': {
		place: function() {
			return this.requirePart('mf_cor_con');
		},
		needs_expand_state: 'must_expand'
	},
	base_tree: {
		sample_name: 'song-view',
		children_by_selector: [{
			parse_as_tplpart: true,
			part_name: 'context',
			needs_expand_state: 'must_expand',
			children_by_selector: [{
				sample_name: 'artist_preview-base',
				selector: '.nested_artist'
			}]
		}]
	}
});
var SongViewLite = function() {};

SongViewBase.extendTo(SongViewLite, {
	canUseDeepWaypoints: function() {
		return false;
	},
	expandBase: function(){
		this.setVisState('lite_view', true);
	},
	base_tree: {
		sample_name: 'song-view'
	}
});
SongUI.SongViewLite = SongViewLite;
return SongUI;
});
