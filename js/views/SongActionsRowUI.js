define(['provoda', 'jquery', 'spv', 'app_serv', './etc_views', './SongActTaggingControl'], function(provoda, $, spv, app_serv, etc_views, SongActTaggingControl) {
"use strict";
var localize = app_serv.localize;


var PlaylistAddSearchCtr = function() {};
provoda.View.extendTo(PlaylistAddSearchCtr, {
	createBase: function() {
		this.c = this.root_view.getSample('song_acting_playlist_add');
		this.createTemplate();
	}
});

var VkShareSearchCtr = function() {};
provoda.View.extendTo(VkShareSearchCtr, {
	createBase: function() {
		this.c = this.root_view.getSample('song_acting_vk_search');
		this.createTemplate();
	}
});



var ShareRowUI = function(){};
provoda.View.extendTo(ShareRowUI, {
	dom_rp: true,
	children_views: {
		vk_auth: etc_views.VkLoginUI,
		searcher: VkShareSearchCtr
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
	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
		}

		if (state){
			var inp = this.tpl.ancs['share_input'][0];
			this.nextTick(function() {
				inp.focus();
			});
		}
	},
	tpl_events: {
		switchClass: function(e, node, data) {
		//	var anc_name = ;
			this.tpl.ancs[data[2]].toggleClass(data[1]);
		//	console.log(data);
		}
	},


	'stch-can_search_friends': {
		fn: function(state){
			if (state){

				var searcher_ui = this.getFreeCV('searcher');
				$(searcher_ui.getA()).insertBefore(this.getPart("pch-ws-friends"));
				this.requestAll();
				//searcher_ui.setVisState('must_be_expanded', true);	
				this.RPCLegacy('search', "");
			}
		},
		dep_vp: [ "pch-ws-friends"]
	},
	'stch-needs_vk_auth': {
		fn: function(state) {
			if (state){
				$(this.getAFreeCV('vk_auth')).insertBefore(this.getPart("pch-vk-auth"));
				this.requestAll();
			}
		},
		dep_vp: ["pch-vk-auth"]
	},
	parts_builder: {
		"pch-vk-auth": function() {
			return this.addWSChunk();
		},
		"pch-ws-friends": function(){
			return this.addWSChunk();
		}
	},
	addWSChunk: function() {
		return $(document.createTextNode("")).appendTo(this.tpl.ancs['vk_share']);
	},
	/*"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
		}
	},*/
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}


		/*
		this.share_input = this.c.find('.song-link').val();
		this.share_input.bind("click focus", function() {
			this.select();
		});
*/
		this.requirePart("pch-vk-auth");
		this.requirePart("pch-ws-friends");
		

		
	}

});

var SongActPlaylistingUI = function() {};
provoda.View.extendTo(SongActPlaylistingUI, {
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

		this['collch-searcher'] = 'lpl';
		this.checkCollectionChange('searcher');

		
		this.RPCLegacy('search', "");

		
		
		
	},
/*	"stch-active_view": function(state){
		this._super.apply(this, arguments);//(state);
		if (state){
			var inp = this.input[0];
			setTimeout(function() {
				inp.focus();
			}, 100);
			
		}
	},*/
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
provoda.View.extendTo(LoveRowUI, {
	children_views: {
		lfm_loveit: etc_views.LfmLoveItView
	},

	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
		}
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		this.c.append(this.getAFreeCV('lfm_loveit'));
		this.requestAll();
	}
});

var ScrobbleRowUI = function(){};
provoda.View.extendTo(ScrobbleRowUI, {
	children_views: {
		lfm_scrobble: etc_views.LfmScrobbleView
	},
	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
		}
	},
	expand: function() {
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}

		this.c.append(this.getAFreeCV('lfm_scrobble'));
		this.requestAll();
	}
	
});




var RepeatSongRowView = function(){};
provoda.View.extendTo(RepeatSongRowView, {
	"stch-rept-song": {
		fn: function(state) {
			this.getPart('rept-chbx').prop('checked', !!state);
		},
		dep_vp: ["rept-chbx"]
	},
	parts_builder: {
		"rept-chbx": function() {
			var _this = this;
			var input = this.c.find('.rept-song-label input').click(function() {
				_this.RPCLegacy('setDnRp', $(this).prop('checked'));
			});
			this.addWayPoint(input);
			return input;
		}
	},

	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
		}
	},
	expand: function() {
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}


		this.requirePart("rept-chbx");
	}
});


var SongActionsRowUI = function() {};
etc_views.ActionsRowUI.extendTo(SongActionsRowUI, {
	dom_rp: true,
	useBase: function(node){
		this.c = node;
		this.createTemplate();
		this.row_context = this.tpl.ancs['row_context'];//this.c.children('.row-song-context');

		this.buttons_panel = this.tpl.ancs['buttons_panel'];
		this.createVolumeControl();
		
		this.arrow = $();//this.tpl.ancs['arrow'];
		var _this = this;

		this.parent_view.on('state-change.mp_show_end', function(e){
			_this.setVisState('is_visible', !!e.value);
		});
		this.wch(this.root_view, 'window_width');
		this.dom_related_props.push('row_context', 'buttons_panel', 'arrow');

	},

	children_views: {
		"row-repeat-song": {
			main: RepeatSongRowView
		},
		'row-lastfm': {
			main: ScrobbleRowUI
		},
		'row-love': {
			main: LoveRowUI
		},
		'row-share': {
			main: ShareRowUI
		},
		'row-tag': {
			main: SongActTaggingControl
		},
		'row-playlist-add': {
			main: SongActPlaylistingUI
		}
	},
	getCurrentButton: function() {
		var active_part = this.state('active_part');
		if (active_part){
			return this.tpl.ancs['bt' + active_part];
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
	getArPaOffset: function() {
		return this.tpl.ancs['arrow'].offsetParent().offset();
	},
	getCurrentButtonOWidth: function() {
		var current_button = this.getCurrentButton();
		return current_button.outerWidth();
	},
	getCurrentButtonOffset: function() {
		var current_button = this.getCurrentButton();
		return current_button.offset();
	},
	'compx-arrow_pos':{
		depends_on: ['window_width', 'active_part'],
		fn: function(window_width, active_part) {
			if (window_width && active_part){
				var button_width = this.getBoxDemension(this.getCurrentButtonOWidth, 'button_owidth', active_part);
				//ширина кнопки, зависит типа вьюхи и активной части

				var button_offset = this.getBoxDemension(this.getCurrentButtonOffset, 'button_offset', window_width, active_part);
				//расположение кнопки, зависит от ширины окна и названия части

				var parent_offset = this.getBoxDemension(this.getArPaOffset, 'arrow_parent_offset', window_width);
				//расположенние позиционного родителя стрелки, зависит от ширины окна

				return ((button_offset.left + button_width/2) - parent_offset.left) + 'px';
			}
		}
	},
	//нужны 
	//active_part
	/*

	
	


	getButtonPos: function(){
		return this.button.offset().left + (this.button.outerWidth()/2);
	},
	"stch-active_view": function(state){
		if (state){
			if (this.expand){
				this.expand();
			}
			var b_pos = this.getButtonPos();
			if (b_pos){
				var arrow = this.parent_view.arrow;
				arrow.css('left', b_pos - arrow.offsetParent().offset().left + 'px');
			}
			this.c.removeClass('hidden');
		} else {
			this.c.addClass('hidden');
		}
	}


	*/
	complex_states: {
		"vis_volume-hole-width": {
			depends_on: ['vis_is_visible', 'vis_con_appended'],
			fn: function(visible, apd){
				if (visible && apd){
					return this.getBoxDemension(this.getVHoleWidth, 'volume-hole-width');
				}
				
			}
		},
		"vis_volume-bar-max-width": {
			depends_on: ['vis_volume-hole-width'],
			fn: function(vvh_w){
				if (vvh_w){
					return  vvh_w - ( this.getBoxDemension(this.getVBarOuterWidth, 'v-bar-o-width') - this.getBoxDemension(this.getVBarWidth, 'v-bar-width'));
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
		//this.tpl = this.getTemplate(this.vol_cc);


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