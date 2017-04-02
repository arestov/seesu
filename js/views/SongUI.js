define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var $ = require('jquery');
var SongActionsRowUI = require('./SongActionsRowUI');
var MfCorUI = require('./MfCorUI');
var ArtcardUI = require('./ArtcardUI');
var SongcardPage = require('./SongcardPage');
var coct = require('./coct');


var SongViewBase = spv.inh(coct.SPView, {}, {
	'compx-vmp_show': [
		['^^vmp_show', 'bmp_show', '^^map_level_num'],
		function(vmp_show, bmp_show, map_level_num) {
			return bmp_show && bmp_show[map_level_num + 1] && vmp_show;
			// return vmp_show;
		}
	],
	tpl_events: {
		showSong: function(e) {
			e.preventDefault();

			if (this.expand) {
				this.expand();
			}

			this.RPCLegacy('requestPlay', pv.$v.getBwlevId(this));
			this.requestPage();
		}
	}
});

var SongUI = spv.inh(SongViewBase, {}, {
	canUseDeepWaypoints: function() {
		return !!this.state('vmp_show');
	},
	dom_rp: true,
	state_change : {
		"vmp_show": function(target, opts, old_opts) {
			if (opts){
				target.activate();
			} else if (old_opts) {
				target.deactivate();
			}
		}
	},
	'compx-mp_show_end': [
		['^mp_show_end']
	],
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
		context: 'track-context',
		mf_cor_con: function() {
			var context = this.requirePart('context');
			var div = $('<div></div>');
			context.prepend(div);
			return div;
		}
	},
	base_tree: {
		sample_name: 'song-view',
		// children_by_selector: [{
		// 	parse_as_tplpart: true,
		// 	part_name: 'context',
		// 	needs_expand_state: 'must_expand'
		// }]
	}
});
var SongViewLite = spv.inh(SongViewBase, {}, {
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
