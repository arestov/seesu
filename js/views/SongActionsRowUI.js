define(function(require) {
'use strict';
var pv = require('pv');
var $ = require('jquery');
var spv = require('spv');
var etc_views = require('./etc_views');
var SongActTaggingControl = require('./SongActTaggingControl');
var View = require('View');
var used_struc_bhv = require('./utils/used_struc').bhv;
var ActionsRowUI = require('./common/ActionsRowUI');

var pvUpdate = pv.update;
var ShareSearchSection = spv.inh(View, {}, {

	toggleVisState: function(state, boolen) {
		var new_value;
		if (typeof boolen == 'undefined'){
			new_value = !this.state('vis_' + state);
		} else {
			new_value = !!boolen;
		}
		this.setVisState(state, new_value);
	},
	toggleVisStateTPL: function(e, node, state_name, value) {
		this.toggleVisState(state_name, value);
	},
	tpl_events:{
		requestFullView: function() {
			this.toggleVisState('full_view_mode', true);
		},
		toggleVisState: function(e, node, state_name, value) {
			this.toggleVisStateTPL(e, node, state_name, value);
		}
	}
});


var VkShareSectionView = spv.inh(ShareSearchSection, {}, {
	children_views:{
		vk_auth: etc_views.VkLoginUI
	},
	'stch-needs_vk_auth': function(target, state) {
		if (state){
			target.tpl.ancs['vk_auth'].append(target.getAFreeCV('vk_auth'));
			target.requestAll();
		}
	},
});

var LFMShareSectionView = spv.inh(ShareSearchSection, {}, {

});

var ShareSearchCtr = spv.inh(View, {}, {
	children_views:{
		'lfm_auth': etc_views.LfmLoginView

	},
	children_views_by_mn: {
		section: {
			'section-vk-users': VkShareSectionView,
			'section-lfm-friends': LFMShareSectionView
		}
	},
	'collch-lfm_auth': 'tpl.ancs.lfm_auth_con'
});





var ShareRowUI = spv.inh(View, {}, {
	dom_rp: true,
	children_views: {

		searcher: ShareSearchCtr
	},
	bindBase: function(){
		var oldv;
		var _this = this;
		var inputSearch = spv.debounce(function() {
			var newval = this.value;
			if (oldv !== newval){
				_this.RPCLegacy('search', newval);
				oldv = newval;
			}

		}, 100);

		this.tpl.ancs['vk_share_search'].bind('keyup change search mousemove', inputSearch);
		this.tpl.ancs['share_input'].bind("click focus", function() {
			this.select();
		});
	},
	focusToInput: function() {
		this.tpl.ancs['share_input'][0].focus();
	},
	"stch-vis_con_appended": function(target, state){
    // !!
		if (state){
			if (target.expand){
				target.expand();
			}
		}

		if (state){
			target.nextLocalTick(target.focusToInput);
		}
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
	}

});

var SongActPlaylistingUI = spv.inh(View, {}, {
  "+states": {
    "need_creation_button": [
      "compx",
      ['query', 'has_full_match'],
      function(query, has_full_match) {
			return query && !has_full_match;
		}
    ]
	},

	tpl_events: {
		input_search: spv.debounce(function(e, node) {
			this.RPCLegacy('search', node.value);
		}, 100)
	}
});








var LoveRowUI = spv.inh(View, {}, {
	children_views: {
		lfm_loveit: etc_views.LfmLoveItView
	},
	'collch-lfm_loveit': 'c',
});

var ScrobbleRowUI = spv.inh(View, {}, {
	children_views: {
		lfm_scrobble: etc_views.LfmScrobbleView
	},
	'collch-lfm_scrobble': 'c',

});

var ArrowPart = spv.inh(ActionsRowUI, {}, {
  // bindBase: function() {
  //   debugger;
  //   window.ee1 = this;
  // },
  '+states': {
    'active_part': [
      "compx", ['vis_con_appended', '^current_md$exists', 'url_part'],
      function(vis_con_appended, parent_visible, url_part) {
        return vis_con_appended && parent_visible && url_part && url_part.slice(1);
      }
    ],
  },

  getCurrentButton: function() {
    var active_part = this.state('active_part');
    if (active_part) {
      return this.parent_view.parent_view.tpl.ancs['bt' + active_part];
    }
  }
});

var Probe = spv.inh(View, {}, spv.cloneObj({
  children_views: {
    current_md: {arrow: ArrowPart}
  },
	children_views_by_mn: {
		current_md: {
			'row-lastfm': ScrobbleRowUI,
			'row-love': LoveRowUI,
			'row-share': ShareRowUI,
			'row-tag': SongActTaggingControl,
			'row-playlist-add': SongActPlaylistingUI,
		}
	},
}, used_struc_bhv));


var SongActionsRowUI = spv.inh(ActionsRowUI, {}, {
	dom_rp: true,
	bindBase: function(){
		this._super();
		this.createVolumeControl();
	},
  "+states": {
    "p_mpshe": [
      "compx",
		['^mp_show_end'],
		function (mp_show_end) {
			return mp_show_end;
		}
	]
	},
	getVHoleWidth: function() {
		return this.tpl.ancs['v-hole'].width();
	},

	getVBarOuterWidth: function() {
		return this.tpl.ancs['v-bar'].outerWidth();
	},

	getVBarWidth: function() {
		return this.tpl.ancs['v-bar'].width();
	},

	'stch-key_vol_hole_w': function(target, value) {
		if (value) {
			pvUpdate(target, 'vis_volume-hole-width', target.getBoxDemensionByKey(target.getVHoleWidth, value));
		}
	},

	'stch-vis_volume-hole-width': function(target, state) {
		if (state) {
			target.updateManyStates({
				'v-bar-o-width': target.getBoxDemension(target.getVBarOuterWidth, 'v-bar-o-width'),
				'v-bar-width': target.getBoxDemension(target.getVBarWidth, 'v-bar-width')
			});
		}
	},

	createVolumeControl: function() {
		this.vol_cc = this.tpl.ancs['volume-control'];

		var events_anchor = this.vol_cc;
		var pos_con = this.tpl.ancs['v-hole'];

		this.dom_related_props.push('vol_cc', 'tpl');
		var _this = this;

		var getClickPosition = function(e, node){
			//e.offsetX ||
			var pos = e.pageX - $(node).offset().left;
			return pos;
		};

		var path_points;
		var volumeChange = function(){
			var last = path_points[path_points.length - 1];

			//promiseStateUpdate
			//setVisState
			var hole_width = _this.state('vis_volume-hole-width');
			if (!hole_width){
				console.log("no width :!((");
			}
			var twid = Math.min(hole_width, Math.max(0, last.cpos));

			_this.promiseStateUpdate('volume', twid/hole_width);
			_this.RPCLegacy('setVolume', [twid, hole_width]);
			/*
			if (!_this.width){
				_this.fixWidth();
			}
			_this.RPCLegacy('setVolumeByFactor', _this.width && (last.cpos/_this.width));
			*/

		};

		var touchDown = function(e){
			path_points = [];
			e.preventDefault();
			path_points.push({cpos: getClickPosition(e, pos_con), time: e.timeStamp});
			volumeChange();
			events_anchor.addClass('interactive-state');
		};
		var touchMove = function(e){

			if (e.which && e.which != 1){
				return true;
			}
			e.preventDefault();
			path_points.push({cpos: getClickPosition(e, pos_con), time: e.timeStamp});
			volumeChange();
		};
		var touchUp = function(e){

			if (e.which && e.which != 1){
				return true;
			}
			$(events_anchor[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			var travel;
			if (!travel){
				//
			}
			events_anchor.removeClass('interactive-state');

			path_points = null;

		};
		events_anchor.on('mousedown', function(e){

			$(events_anchor[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			if (e.which && e.which != 1){
				return true;
			}

			$(events_anchor[0].ownerDocument)
				.on('mouseup', touchUp)
				.on('mousemove', touchMove);

			touchDown(e);

		});
	}
});

return SongActionsRowUI;
});
