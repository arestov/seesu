define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var $ = require('jquery');
var app_serv = require('app_serv');
var FuncsQueue = require('js/libs/FuncsQueue');
var nav = require('./nav');
var coct = require('./coct');

var AppBaseView = require('./AppBaseView');
var WPBox = require('./modules/WPBox');
var View = require('View');
var etc_views = require('./etc_views');
var arrowsKeysNav = require('./utils/arrowsKeysNav');
var map_slice_by_model = require('./pages/index');
var used_struc_bhv = require('./utils/used_struc').bhv;

var View = require('View');

var app_env = app_serv.app_env;
var pvUpdate = pv.update;

function initRootView(root_view) {
	root_view.all_queues = [];
	var addQueue = function() {
		this.reverse_default_prio = true;
		root_view.all_queues.push(this);
		return this;
	};
	var resortQueue = function(queue) {
		root_view.resortQueue(queue);
	};

	root_view.lfm_imgq = new FuncsQueue({
		time: [700],
		init: addQueue,
		resortQueue: resortQueue
	});
	root_view.dgs_imgq = new FuncsQueue({
		time: [1200],
		init: addQueue,
		resortQueue: resortQueue
	});

	root_view.dgs_imgq_alt = new FuncsQueue({
		time: [250],
		init: addQueue,
		resortQueue: resortQueue
	});
}


var SearchCriteriaView = spv.inh(View, {}, {
	tpl_events: {
		preventSubmit: function (e) {
			e.preventDefault();
		}
	},
	'compx-startpage_autofocus': [['^startpage_autofocus']],
	'stch-startpage_autofocus': function(target, value) {
		if (!value) {
			return;
		}

		target.nextLocalTick(target.tickCheckFocus);
	},
	tickCheckFocus: function() {
		this.tpl.ancs['search_face'][0].focus();
	},
});


var AppExposedView = spv.inh(AppBaseView.BrowserAppRootView, {}, {
	location_name: 'exposed_root_view',
	'stch-doc_title': function(target, title) {
		target.d.title = title || "";
	},
	'stch-playing': function(target, state) {
		if (app_env.need_favicon){
			if (state){
				target.changeFavicon('playing');
			} else {
				target.changeFavicon('usual');
			}
		}
	},
	changeFavicon: spv.debounce(function(state){
		if (!this.isAlive()){ return; }

		if (state && this.favicon_states[state]){
			this.favicon_node = changeFaviconNode(this.d, this.favicon_node, this.favicon_states[state], 'image/png');
		} else{
			this.favicon_node = changeFaviconNode(this.d, this.favicon_node, this.favicon_states['usual'], 'image/png');
		}
	}, 300),
	favicon_states: {
		playing: 'icons/icon16p.png',
		usual: 'icons/icon16.png'
	}
});

function changeFaviconNode(d, oldLink, src, type) {
	var link = d.createElement('link');
	oldLink = oldLink || d.getElementById('dynamic-favicon');
	link.id = 'dynamic-favicon';
	link.rel = 'shortcut icon';
	if (type){
		link.type = type;
	}

	link.href = src;
	d.head.replaceChild(link, oldLink);
	return link;
}

var push = Array.prototype.push;

var BrowseLevView = spv.inh(View, {}, spv.cloneObj({
	children_views_by_mn: {
		pioneer: map_slice_by_model
	},
	base_tree: {
		sample_name: 'browse_lev_con'
	},
	'stch-map_slice_view_sources': function(target, state) {
		if (state) {
			if (target.location_name == 'map_slice-detailed') {
				return;
			}
			if (target.parent_view == target.root_view && target.nesting_name == 'map_slice') {
				var arr = [];
				if (state[0]) {
					arr.push(state[0]);
				}
				push.apply(arr, state[1][target.nesting_space]);
				pvUpdate(target, 'view_sources', arr);
			}

		}
	},
	'collch-$spec_common-pioneer': {
		by_model_name: true,
		place: 'tpl.ancs.con'
	},
	'collch-$spec_det-pioneer': {
		space: 'all-sufficient-details',
		by_model_name: true,
		place: 'tpl.ancs.con'
	},

	'collch-$spec_noplace-pioneer': {
		by_model_name: true
	},
	// 'collch-$spec_wrapped-pioneer': {
	// 	is_wrapper_parent: '^',
	// 	space: 'all-sufficient-details',
	// 	by_model_name: true,
	// 	place: 'tpl.ancs.con'
	// },
	'sel-coll-pioneer//detailed':'$spec_det-pioneer',
	'sel-coll-pioneer/start_page': '$spec_noplace-pioneer',
	// 'sel-coll-pioneer/song': '$spec_wrapped-pioneer',
	'sel-coll-pioneer': '$spec_common-pioneer',

	'compx-mp_show_end': {
		depends_on: ['animation_started', 'animation_completed', 'vmp_show'],
		fn: function(animation_started, animation_completed, vmp_show) {
			if (!animation_started){
				return vmp_show;
			} else {
				if (animation_started == animation_completed){
					return vmp_show;
				} else {
					return false;
				}
			}
		}
	},
}, used_struc_bhv));


var BrowseLevNavView = spv.inh(View, {}, {
	base_tree: {
		sample_name: 'brow_lev_nav'
	},
	children_views_by_mn: {
		pioneer: {
			$default: nav.baseNavUI,
			start_page: nav.StartPageNavView,
			invstg: nav.investgNavUI
		}
	},
	'collch-pioneer': {
		by_model_name: true,
		place: 'c'
	},
	'compx-nav_clickable':{
		depends_on: ['mp_stack', 'mp_has_focus'],
		fn : function(mp_stack, mp_has_focus) {
			return !mp_has_focus && (mp_stack == 'root' || mp_stack == 'top');
		}
	},
	'compx-mp_stack_root_follower': [
		['$index', '$index_back', 'vmp_show'],
		function (index, index_back) {
			if (index == 0) {
				return;
			}

			if (index_back == 0) {
				// title
				return;
			}

			return index == 1;
		}
	],
	'compx-mp_stack': [
		['$index', '$index_back', 'vmp_show'],
		function (index, index_back, vmp_show) {
			if (index == 0) {
				return vmp_show && 'root';
			}

			if (index_back == 0) {
				// title
				return;
			}

			if (index_back == 1) {
				return 'top';
			}

			if (index == 1) {
				return 'bottom';
			}

			return 'middle';
		}
	]
});

var AppView = spv.inh(AppBaseView.WebComplexTreesView, {}, {
	/*children_views_by_mn: {
		navigation: {
			$default: nav.baseNavUI,
			start_page: nav.StartPageNavView,
			invstg: nav.investgNavUI
		}
	},*/
	'sel-coll-map_slice/song': '$spec_det-map_slice',
	'nest_borrow-search_criteria': [
		'^search_criteria',
		SearchCriteriaView
	],
	children_views: {
		map_slice: {
			main: BrowseLevView,
			detailed: BrowseLevView
		},
		navigation: BrowseLevNavView,
		// search_criteria: SearchCriteriaView,
	},
	controllers: {
		auth_vk: etc_views.VkLoginUI,
		auth_lfm: etc_views.LfmLoginView,
		image_loader: coct.ImageLoader
	},

	state_change: {
		"wait-vk-login": function(target, state) {
			target.toggleBodyClass(state, 'wait-vk-login');
		},
		"vk-waiting-for-finish": function(target, state){
			target.toggleBodyClass(state, 'vk-waiting-for-finish');
		},
		"slice-for-height": function(target, state){
			target.toggleBodyClass(state, 'slice-for-height');
		},
		"deep_sandbox": function(target, state){
			target.toggleBodyClass(state, 'deep-sandbox');
		},

		// "search_query": function(target, state) {
		// 	target.search_input.val(state || '');
		// }

	},

	createDetails: function(){
		this._super();
		var _this = this;
		this.wp_box = new WPBox(this, function() {
			return _this.getNesting('current_mp_md');
		}, function(waypoint) {
			_this.setVisState('current_wpoint', waypoint);
		}, function(cwp) {
			$(cwp.node).click();
			$(cwp.node).trigger('activate_waypoint');

			setTimeout(function() {
				if (_this.state('vis_current_wpoint') != cwp) {
					return;
				}
				var still_in_use = _this.wp_box.isWPAvailable(cwp);
				if (still_in_use){
					_this.scrollToWP(still_in_use);
				} else {
					_this.setVisState('current_wpoint', false);
				}
			},100);
		}, function() {
			return _this.state('vis_current_wpoint');
		}, function(wp) {
			var cur_wp = _this.state('vis_current_wpoint');
			if (cur_wp == wp) {
				_this.setVisState('current_wpoint', false);
			}
		});

		_this.dom_related_props.push('favicon_node', 'wp_box');

		initRootView(this);

		this.on('vip_state_change-current_mp_md', function() {
			var cwp = this.state('vis_current_wpoint');
			if (cwp){
				if (cwp.canUse && !cwp.canUse()){
					_this.setVisState('current_wpoint', false);
				}
			}

		}, {skip_reg: true, immediately: true});

	},
	/*'compx-window_demensions_key': {
		depends_on: ['window_width', 'window_height'],
		fn: function(window_width, window_height) {
			return window_width + '-' + window_height;
		}
	},*/


	toggleBodyClass: function(add, class_name){
		if (add){
			this.c.addClass(class_name);
		} else {
			this.c.removeClass(class_name);
		}
	},

	parts_builder: {
		//samples
		'people-list-item': function() {
			return this.els.ui_samples.children('ul').children('.people-list-item');
		},
		'song-view': function() {
			return this.els.ui_samples.children('ul').children('.song-view');
		},
	},

	buildWidthStreamer: function(target) {
		(function(_this) {
			var app_workplace_width_stream_node = $("#pages_area_width_streamer", _this.d);
			var awwst_win =  app_workplace_width_stream_node[0].contentWindow;

			var style = awwst_win.document.documentElement.style;

			style.padding = 0;
			style.margin = 0;
			style.border = 0;
			style.background = 'transparent';

		// spv.getDefaultView(app_workplace_width_stream_node[0]);
			_this.updateManyStates({
				workarea_width: awwst_win.innerWidth
			});


			var checkWAWidth = spv.debounce(function() {
				//console.log( awwst_win.innerWidth);
				_this.updateManyStates({
					workarea_width: awwst_win.innerWidth
				});
			}, 150);

			spv.addEvent(awwst_win, 'resize', checkWAWidth);

			//$(wd).on('resize', checkWindowSizes);
			_this.onDie(function(){
				spv.removeEvent(awwst_win, 'resize', checkWAWidth);
				awwst_win = null;
				_this = null;
			});


		})(target);
	},
	buildVKSamples: function() {
		var vklc = this.els.ui_samples.children('.vk_login_common');
		vklc.addClass('vk-login-context attention-focuser');
		var _this = this;
		spv.cloneObj(_this.samples, {
			vklc: vklc
		});
	},
	checkSizeDetector: function() {
		var self = this;
		if (!app_env.check_resize) {
			return;
		}

		var detectSize = function(D){
			if (!D){
				return 0;
			} else {
				return $(D).outerHeight();
			}

			//return Math.max(D.scrollHeight, D.offsetHeight, D.clientHeight);
		};
		var getCurrentNode = function() {
			var current_md = self.getNesting('current_mp_md');
			return current_md && self.getStoredMpx(current_md).getRooConPresentation(this, true, true).getC();
		};

		if (self.rsd_rz){
			clearInterval(self.rsd_rz);
		}

		var oldsize = detectSize(getCurrentNode());
		var offset_top;

		var recheckFunc = function(){
			if (typeof window.documentScrollSizeChangeHandler == 'function'){
				var newsize = detectSize(getCurrentNode());

				if (oldsize != newsize){
					if (typeof offset_top == 'undefined'){
						var offset = $(getCurrentNode()).offset();
						offset_top = (offset && offset.top) || 0;
					}
					window.documentScrollSizeChangeHandler((oldsize = newsize) + offset_top);
				}

			}
		};

		self.rsd_rz = setInterval(recheckFunc, 100);

		self.on('vip_state_change-current_mp_md', function() {
			recheckFunc();
		}, {
			immediately: true
		});
	},
	calculateScrollingViewport: function(screens_block) {
		var scrolling_viewport;

		if (screens_block.css('overflow') == 'auto') {
			scrolling_viewport = {
				node: screens_block
			};
		} else if (app_env.as_application){
			scrolling_viewport = {
				node: screens_block
			};
		} else {
			if (app_env.lg_smarttv_app){
				scrolling_viewport = {
					node: screens_block
				};
			} else {
				scrolling_viewport = {
					node: $( this.d.body ),
					offset: true
				};
			}
		}
		return scrolling_viewport;
	},
	buildNowPlayingButton: function() {
		var _this = this;
		var np_button = this.nav.justhead.find('.np-button').detach();
		_this.tpls.push( pv.$v.createTemplate( this, np_button ) );
		this.nav.daddy.append(np_button);
	},
	'stch-nav_helper_is_needed': function(target, state) {
		if (!state) {
			pv.update(target, 'nav_helper_full', false);
		}
	},
	tpl_events: {
		showFullNavHelper: function() {
			pv.update(this, 'nav_helper_full', true);
		},
		showArtcardPage: function (e, node, artist_name) {
			this.RPCLegacy('showArtcardPage', artist_name);
		}
	},
	buildNavHelper: function() {
		this.tpls.push( pv.$v.createTemplate(
			this, this.els.nav_helper
		) );
	},
	selectKeyNodes: function() {
		var slider = this.d.getElementById('slider');
		var screens_block = $( '#screens', this.d );
		var app_map_con = screens_block.children('.app_map_con');
		var scrolling_viewport = this.calculateScrollingViewport(screens_block);

		var start_screen = $( '#start-screen', this.d );


		spv.cloneObj(this.els, {
			screens: screens_block,
			app_map_con: app_map_con,
			scrolling_viewport: scrolling_viewport,
			slider: slider,
			navs: $(slider).children('.navs'),
			nav_helper: $(slider).children().children('#nav-helper'),
			start_screen: start_screen,
			pestf_preview: start_screen.children('.personal-stuff-preview')
		});

	},
	buildAppDOM: spv.precall(AppBaseView.WebComplexTreesView.prototype.buildAppDOM, function() {
		var _this = this;
		var d = this.d;

			console.log('dom ready');

			_this.checkSizeDetector();
			_this.nextTick(_this.buildWidthStreamer);

			_this.wrapStartScreen(this.els.start_screen);
			$('#widget-url',d).val(window.location.href.replace('index.html', ''));

			if (app_env.bro.browser.opera && ((typeof window.opera.version == 'function') && (parseFloat(window.opera.version()) <= 10.1))){

				$('<a id="close-widget">&times;</a>',d)
					.click(function(){
						window.close();
					})
					.prependTo(_this.els.slider);
			}

			_this.buildVKSamples();

			_this.buildNowPlayingButton();
			_this.buildNavHelper();

			var d_click_callback = function(e) {
				e.preventDefault();
				app_env.openURL($(this).attr('href'));
				_this.trackEvent('Links', 'just link');
			};

			$(d).on('click', '.external', d_click_callback);
			_this.onDie(function() {
				$(d).off('click', d_click_callback);
			});



			var kd_callback = function(e){
				if (d.activeElement && d.activeElement.nodeName == 'BUTTON'){return;}
				if (d.activeElement && d.activeElement.nodeName == 'INPUT'){
					if (e.keyCode == 27) {
						d.activeElement.blur();
						e.preventDefault();
						return;
					}
				}

				arrowsKeysNav(_this, e);
			};

			$(d).on('keydown', kd_callback);

			_this.onDie(function() {
				$(d).off('keydown', kd_callback);
			});


			_this.onDie(function() {
				_this = null;
				d = null;
			});
	}),
	scrollToWP: function(cwp) {
		if (cwp){
			var cur_md_md = this.getNesting('current_mp_md');
			var parent_md = cur_md_md.getParentMapModel();
			if (parent_md && cwp.view.getAncestorByRooViCon('main') == this.getStoredMpx(parent_md).getRooConPresentation(this)){
				this.scrollTo($(cwp.node), {
					node: this.getLevByNum(parent_md.map_level_num).scroll_con
				}, {vp_limit: 0.6, animate: 117});
			}
			this.scrollTo($(cwp.node), false, {vp_limit: 0.6, animate: 117});
		}
	},
	'stch-vis_current_wpoint': function(target, nst, ost) {
		if (ost){
			$(ost.node).removeClass('surf_nav');
		}
		if (nst) {
			$(nst.node).addClass('surf_nav');
			target.scrollToWP(nst);
		}
	},

	trackEvent: function() {
		var args = Array.prototype.slice.apply(arguments);
		args.unshift('trackEvent');
		this.RPCLegacy.apply(this, args);
	},
	bindLfmTextClicks: function(con) {
		var _this = this;
		con.on('click', 'a', function(e) {
			var node = $(this);
			var link = node.attr('href');
			if (node.is('.bbcode_artist')){
				e.preventDefault();

				var artist_name = decodeURIComponent(link.replace('http://www.last.fm/music/','').replace(/\+/g, ' '));
				_this.root_view.tpl_events.showArtcardPage.call(_this.root_view, null, null, artist_name);
				_this.trackEvent('Artist navigation', 'bbcode_artist', artist_name);
			} else if (node.is('.bbcode_tag')){
				e.preventDefault();

				var tag_name = decodeURIComponent(link.replace('http://www.last.fm/tag/','').replace(/\+/g, ' '));
				_this.RPCLegacy('show_tag', 'artist_name');
				_this.trackEvent('Artist navigation', 'bbcode_tag', tag_name);
			} else {
				e.preventDefault();
				app_env.openURL(link);
				_this.trackEvent('Links', 'just link');
			}
		});

	},
});

AppView.AppExposedView = AppExposedView;
return AppView;
});
