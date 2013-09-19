define(['provoda', 'jquery', 'spv', 'app_serv', './etc_views', './SearchPageViewBase', './SongActTaggingControl'], function(provoda, $, spv, app_serv, etc_views, SearchPageViewBase, SongActTaggingControl) {
"use strict";
var localize = app_serv.localize;

var baseSuggestUI = function(){};
provoda.extendFromTo('baseSuggestView', provoda.View, baseSuggestUI);
var searchSectionUI = function(){};
provoda.extendFromTo("searchSectionView", provoda.View, searchSectionUI);
var investigationView  = function(){};
provoda.extendFromTo('InvestigationView', provoda.View, investigationView);


var struserSuggestView = function() {};
baseSuggestUI.extendTo(struserSuggestView, {
	createItem: function() {
		var that = this.mpx.md;
		this.a = $('<a></a>')
			.text(that.text_title)
			.appendTo(this.c);
		$('<img />').attr("src", that.photo).prependTo(this.a);
		this.c.addClass('share-user-suggest');
		return this;
	}
});

var ShSSectionView = function() {};
searchSectionUI.extendTo(ShSSectionView, {
	children_views: {
		item: struserSuggestView
	}
});

var ShareSearchView = function() {};
investigationView.extendTo(ShareSearchView, {
	children_views: {
		"section-vk-users": ShSSectionView
	}
});

var PASSectionView = function() {};
searchSectionUI.extendTo(PASSectionView, {
	children_views: {
		item: baseSuggestUI
	}
	
});

var PlaylistAddSsearchView = function() {};
investigationView.extendTo(PlaylistAddSsearchView, {
	children_views: {
		"section-playlist": PASSectionView
	}
});




var ShareRowUI = function(){};
etc_views.BaseCRowUI.extendTo(ShareRowUI, {
	children_views: {
		vk_auth: etc_views.VkLoginUI,
		searcher: ShareSearchView
	},
	createDetails: function(){
		var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
		this.c = parent_c.children('.share-song');
		this.button = buttons_panel.find('.pc-place .pc-rupor');

		this.users_c = this.parent_view.tpl.ancs['vk_share'];

		this.dom_related_props.push('button','users_c');
		$("<h3></h3>").text(localize('post-song')).appendTo(this.users_c);
		this.bindClick();

	},
	'stch-share_url': {
		fn: function(state){
			this.getPart("share_input").val(state || "");
		//	dep_vp
		},
		dep_vp: ['share_input']
	},
	'stch-can_post_to_own_wall':{
		fn: function(){
			this.requirePart("own-wall-button");
		},
		dep_vp: ['pch-ws-own']
	},
	'stch-own_photo': {
		fn: function(state) {
			if (state){
				if (this.own_photo){
					this.own_photo.remove();
				}
				this.own_photo = $("<img />").attr("src", state).prependTo(this.getPart("own-wall-button"));
			}
		},
		dep_vp: ["own-wall-button"]
	},
	'stch-can_search_friends': {
		fn: function(state){
			if (state){
				var _this = this;
				var oldv;
				var inputSearch = spv.debounce(function() {
					var newval = this.value;
					if (oldv !== newval){
						_this.RPCLegacy('search', newval);
						oldv = newval;
					}
					
				}, 100);

				var input_place = $("<div class='list-search-input-place'></div>").insertBefore(this.getPart("pch-ws-input"));

				this.input = $("<input type='text'/>").appendTo(input_place)
					.bind('keyup change search mousemove', inputSearch);

				$("<div class='friends-search-desc desc'></div>")
					.text(localize("or-wall-of-f"))
					.insertBefore(this.getPart("pch-ws-friends"));

				this.getPart("pch-ws-friends").after();
				var searcher_ui = this.getFreeCV('searcher');
				$(searcher_ui.getA()).insertBefore(this.getPart("pch-ws-friends"));
				this.requestAll();
				searcher_ui.expand();
				
				this.RPCLegacy('search', "");
			}
			
		},
		dep_vp: ['pch-ws-input', "pch-ws-friends"]
	},
	'stch-needs_vk_auth ': {
		fn: function(state) {
			if (state){
				$(this.getAFreeCV('vk_auth')).insertBefore(this.getPart("pch-vk-auth"));
				this.requestAll();
			}
		},
		dep_vp: ["pch-vk-auth"]
	},
	parts_builder: {
		share_input: function(){
			var share_input = this.c.find('.song-link');
			share_input.bind("click focus", function() {
				this.select();
			});
			this.addWayPoint(share_input);
			return share_input;
		},
		"own-wall-button": function() {
			var _this = this;
			var ptmw_link = $("<div class='post-to-my-vk-wall'></div>").click(function(){
				_this.RPCLegacy('postToVKWall');
			}).text(localize("to-own-wall")).insertBefore(this.getPart("pch-ws-own"));
			this.addWayPoint(ptmw_link);
			return ptmw_link;
		},
		"pch-vk-auth": function() {
			return this.addWSChunk();
		},
		"pch-ws-own": function(){
			return this.addWSChunk();
		},
		"pch-ws-input": function(){
			return this.addWSChunk();
		},
		"pch-ws-friends": function(){
			return this.addWSChunk();
		}
	},
	addWSChunk: function() {
		return $(document.createTextNode("")).appendTo(this.users_c);
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}


		this.requirePart("share_input");
		
		/*
		this.share_input = this.c.find('.song-link').val();
		this.share_input.bind("click focus", function() {
			this.select();
		});
*/
		this.requirePart("pch-ws-input");
		this.requirePart("pch-ws-own");
		this.requirePart("pch-vk-auth");
		this.requirePart("pch-ws-friends");
		

		
	}

});

var SongActPlaylistingUI = function() {};
etc_views.BaseCRowUI.extendTo(SongActPlaylistingUI, {
	children_views: {
		searcher: PlaylistAddSsearchView
	},
	createDetails: function(){
		var parent_c = this.parent_view.row_context;
		var buttons_panel = this.parent_view.buttons_panel;
		this.c = parent_c.children('.addsong-to-playlist');
		this.button = buttons_panel.find('.pc-place .pc-add');
		this.dom_related_props.push('button');
		this.bindClick();
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


		var searcher_ui = this.getFreeCV('searcher');
		this.lpl.append(searcher_ui.getA());
		this.requestAll();
		searcher_ui.expand();
		
		this.RPCLegacy('search', "");

		
		
		
	},
	"stch-active_view": function(state){
		this._super.apply(this, arguments);//(state);
		if (state){
			var inp = this.input[0];
			setTimeout(function() {
				inp.focus();
			}, 100);
			
		}
	},
	state_change: {
		query: function(state) {
			if (this.pl_creation_b){
				if (state){
					this.pl_creation_b_text.text(state);
					this.pl_creation_b.removeClass('hidden');
				} else {
					this.pl_creation_b.addClass('hidden');
				}
			}
			
		}
	}
	
});








var LoveRowUI = function(){};
etc_views.BaseCRowUI.extendTo(LoveRowUI, {
	children_views: {
		lfm_loveit: etc_views.LfmLoveItView
	},
	createDetails: function(){
		var parent_c = this.parent_view.row_context;
		var buttons_panel = this.parent_view.buttons_panel;
		this.c = parent_c.children('.love-song');
		this.button = buttons_panel.find('.pc-place .pc-love');
		this.dom_related_props.push('button');

		this.bindClick();
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
etc_views.BaseCRowUI.extendTo(ScrobbleRowUI, {
	children_views: {
		lfm_scrobble: etc_views.LfmScrobbleView
	},
	createDetails: function(){
		var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
		this.c = parent_c.children('.last-fm-scrobbling');
		this.button = buttons_panel.find('.lfm-scrobbling-button');
		this.dom_related_props.push('button');
		this.bindClick();

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
etc_views.BaseCRowUI.extendTo(RepeatSongRowView, {
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
	createDetails: function(){
		var parent_c = this.parent_view.row_context; var buttons_panel = this.parent_view.buttons_panel;
		this.c =  parent_c.children('.rept-song');
		this.button = buttons_panel.find('.rept-song-button');
		this.dom_related_props.push('button');
		this.bindClick();
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
		
		this.arrow = this.tpl.ancs['arrow'];
		var _this = this;

		this.parent_view.on('state-change.mp_show_end', function(e){
			_this.setVisState('is_visible', !!e.value);
		});
		this.dom_related_props.push('row_context', 'buttons_panel', 'arrow');

	},
	tpl_events: {
		switchClass: function(e, node, data) {
		//	var anc_name = ;
			this.tpl.ancs[data[2]].toggleClass(data[1]);
		//	console.log(data);
		}
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

	complex_states: {
		"vis_volume-hole-width": {
			depends_on: ['vis_is_visible', 'vis_con_appended'],
			fn: function(visible, apd){
				return !!(visible && apd) && this.tpl.ancs['v-hole'].width();
			}
		},
		"vis_volume-bar-max-width": {
			depends_on: ['vis_volume-hole-width'],
			fn: function(vvh_w){
				return vvh_w && vvh_w - ( this.tpl.ancs['v-bar'].outerWidth() - this.tpl.ancs['v-bar'].width());
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