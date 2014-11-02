define(['pv', 'jquery', 'spv', 'app_serv', './etc_views', './SongActTaggingControl'], function(pv, $, spv, app_serv, etc_views, SongActTaggingControl) {
"use strict";
var localize = app_serv.localize;


var PlaylistAddSearchCtr = function() {};
pv.View.extendTo(PlaylistAddSearchCtr, {
	base_tree: {
		sample_name: 'song_acting_playlist_add'
	}
});


var ShareSearchSection = function() {};
pv.View.extendTo(ShareSearchSection, {

	toggleVisState: function(state, boolen) {
		var new_value;
		if (typeof boolen == 'undefined'){
			new_value = !this.state('vis_' + state);
		} else {
			new_value = !!boolen;
		}
		this.setVisState(state, new_value);
	},
	toggleVisStateTPL: function(e, node, data) {
		var boolen = data[2];
		this.toggleVisState(data[1], boolen);
	},
	tpl_events:{
		requestFullView: function() {
			this.toggleVisState('full_view_mode', true);
		},
		toggleVisState: function(e, node, data) {
			this.toggleVisStateTPL(e, node, data);
		}
	}
});


var VkShareSectionView = function() {};
ShareSearchSection.extendTo(VkShareSectionView, {
	children_views:{
		vk_auth: etc_views.VkLoginUI
	},
	'stch-needs_vk_auth': function(state) {
		if (state){
			this.tpl.ancs['vk_auth'].append(this.getAFreeCV('vk_auth'));
			this.requestAll();
		}
	},
});

var LFMShareSectionView = function() {};
ShareSearchSection.extendTo(LFMShareSectionView, {

});

var ShareSearchCtr = function() {};
pv.View.extendTo(ShareSearchCtr, {
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





var ShareRowUI = function(){};
pv.View.extendTo(ShareRowUI, {
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
	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
		}

		if (state){
			this.nextLocalTick(this.focusToInput);
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

var SongActPlaylistingUI = function() {};
pv.View.extendTo(SongActPlaylistingUI, {
	children_views: {
		searcher: PlaylistAddSearchCtr
	},
	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
		}
	},
	'collch-$ondemand-searcher': 'lpl',
	expand: function() {
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		

		var _this = this;
		var inputSearch = spv.debounce(function() {
			_this.RPCLegacy('search', this.value);
		}, 100);
		this.input = this.c.find('.playlist-query').bind('keyup change search mousemove', inputSearch);

		this.lpl = $('<div class="list-of-playlists"></div>').appendTo(this.c);


		this.pl_creation_b = $("<div class='create-named-playlist hidden suggest'></div>").click(function() {
			_this.RPCLegacy('findAddPlaylist');
		});
		this.addWayPoint(this.pl_creation_b);
		this.pl_creation_b_text = $('<span></span>');
		this.pl_creation_b.append(localize("cr-new-playlist") + ' "').append(this.pl_creation_b_text).append('"');
		this.lpl.append(this.pl_creation_b);

		//this['collch-searcher'] = 'lpl';
		this.checkCollectionChange('searcher');

		
		this.RPCLegacy('search', "");

		
		
		
	},
	tpl_events: {
		input_search: spv.debounce(function(e, node) {
			this.RPCLegacy('search', node.value);
		}, 100)
	},

	state_change: {
		need_creation_button: function(state) {
			if (this.pl_creation_b){
				this.pl_creation_b.toggleClass('hidden', !state);
			}
		},
		query: function(state) {
			if (this.pl_creation_b_text){
				this.pl_creation_b_text.text(state);
			}
		}
	}
	
});








var LoveRowUI = function(){};
pv.View.extendTo(LoveRowUI, {
	children_views: {
		lfm_loveit: etc_views.LfmLoveItView
	},
	'collch-$ondemand-lfm_loveit': {
		place: 'c',
		needs_expand_state: 'active_view'
	}
});

var ScrobbleRowUI = function(){};
pv.View.extendTo(ScrobbleRowUI, {
	children_views: {
		lfm_scrobble: etc_views.LfmScrobbleView
	},
	'collch-$ondemand-lfm_scrobble': {
		place: 'c',
		needs_expand_state: 'active_view'
	}
	
});





var SongActionsRowUI = function() {};
etc_views.ActionsRowUI.extendTo(SongActionsRowUI, {
	dom_rp: true,
	bindBase: function(){
		this._super();

		this.createVolumeControl();
		
		this.wch(this.parent_view, 'mp_show_end', function(e){
			this.setVisState('is_visible', !!e.value);
		});

	},
	'compx-p_mpshe': [
		['^mp_show_end'],
		function (mp_show_end) {
			return mp_show_end;
		}
	],
	children_views_by_mn: {
		context_parts: {
			'row-lastfm': ScrobbleRowUI,
			'row-love': LoveRowUI,
			'row-share': ShareRowUI,
			'row-tag': SongActTaggingControl,
			'row-playlist-add': SongActPlaylistingUI,
		}
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
	'stch-key_vol_hole_w': function(value) {
		if (value) {
			pv.update(this, 'vis_volume-hole-width', this.getBoxDemensionByKey(this.getVHoleWidth, value));
		}
	},
	'stch-vis_volume-hole-width': function(state) {
		if (state) {
			this.updateManyStates({
				'v-bar-o-width': this.getBoxDemension(this.getVBarOuterWidth, 'v-bar-o-width'),
				'v-bar-width': this.getBoxDemension(this.getVBarWidth, 'v-bar-width')
			});
		}
	},

	complex_states: {

		"key_vol_hole_w": [
			['vis_is_visible', 'vis_con_appended'],
			function (visible, apd) {
				if (visible && apd) {
					return this.getBoxDemensionKey('volume-hole-width');
				}
			}
		],
		"vis_volume-bar-max-width": {
			depends_on: ['vis_volume-hole-width', 'v-bar-o-width', 'v-bar-width'],
			fn: function(vvh_w, v_bar_o_w, v_bar_w){
				if (vvh_w){
					return  vvh_w - ( v_bar_o_w - v_bar_w);
				}
				
			}
		},
		"vis_volume": {
			depends_on: ['volume', 'vis_volume-bar-max-width'],
			fn: function(volume_fac, vvb_mw){
				if (typeof volume_fac =='undefined'){
					return 'auto';
				} else if (vvb_mw){
					return Math.floor(volume_fac * vvb_mw) + 'px';
				} else {
					return (volume_fac * 100)  + '%';
				}
			}
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