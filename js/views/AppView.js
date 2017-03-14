define(['pv', 'spv', 'jquery', 'app_serv', 'js/libs/FuncsQueue', './nav', './coct' ,'./uacq',
'./StartPageView', './SearchPageView', './ArtcardUI', './ArtistListView',
'./SongsListView', './UserCardPage', './MusicConductorPage', './TagPageView' ,'./YoutubeVideoView',
'./lul', './SongcardPage', './AppBaseView', './modules/WPBox', 'view_serv', 'View', './etc_views'],
function(pv, spv, $, app_serv, FuncsQueue, nav, coct, uacq,
StartPageView, SearchPageView, ArtcardUI, ArtistListView,
SongsListView, UserCardPage, MusicConductorPage, TagPageView, YoutubeVideoView,
lul, SongcardPage, AppBaseView, WPBox, view_serv, View, etc_views) {
"use strict";
var app_env = app_serv.app_env;
var pvUpdate = pv.update;

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
			changeFaviconNode(this.d, this.favicon_states[state], 'image/png');
		} else{
			changeFaviconNode(this.d, this.favicon_states['usual'], 'image/png');
		}
	}, 300),
	favicon_states: {
		playing: 'icons/icon16p.png',
		usual: 'icons/icon16.png'
	}
});

function changeFaviconNode(d, src, type) {
	var link = d.createElement('link'),
		oldLink = this.favicon_node || d.getElementById('dynamic-favicon');
	link.id = 'dynamic-favicon';
	link.rel = 'shortcut icon';
	if (type){
		link.type = type;
	}

	link.href = src;
	d.head.replaceChild(link, oldLink);
	this.favicon_node = link;
}


var map_slice_by_model = {
	$default: coct.ListOfListsView,
	start_page : StartPageView,
	invstg: SearchPageView,
	artcard: ArtcardUI,
	artslist: ArtistListView,
	playlist: {
		'main': SongsListView,
		'all-sufficient-details': SongsListView.SongsListDetailedView,
	},
	vk_usercard: UserCardPage.VkUsercardPageView,
	lfm_usercard: UserCardPage.LfmUsercardPageView,
	usercard: UserCardPage,
	allplaces: coct.SimpleListOfListsView,
	mconductor: MusicConductorPage,
	tag_page: TagPageView,
	tagslist: TagPageView.TagsListPage,
	user_playlists: coct.ListOfListsView,
	songs_lists: coct.ListOfListsView,
	artists_lists: coct.ListOfListsView,
	сountries_list: coct.SimpleListOfListsView,
	city_place: coct.SimpleListOfListsView,
	cities_list: coct.SimpleListOfListsView,
	country_place: coct.ListOfListsView,
	tag_artists: coct.ListOfListsView,
	tag_songs: coct.ListOfListsView,
	youtube_video: YoutubeVideoView,
	vk_users: UserCardPage.VkUsersPageView,
	lfm_users: lul.LfmUsersPageView,
	lfm_listened_artists: coct.ListOfListsView,
	lfm_listened_tracks: coct.ListOfListsView,
	lfm_listened_albums: coct.ListOfListsView,
	lfm_listened_tags: lul.UserTagsPageView,
	vk_users_tracks: coct.ListOfListsView,
	lfm_user_tag: coct.ListOfListsView,
	user_acqs_list: uacq.UserAcquaintancesListView,
	albslist: coct.AlbumsListView,
	lula: lul.LULAPageVIew,
	lulas: lul.LULAsPageVIew,
	songcard: SongcardPage,
	justlists: coct.ListOfListsView,
	vk_posts: coct.VKPostsView,
	blogs_conductor: coct.ListOfListsView,
	blogs_list: coct.ListOfListsView,
	music_blog: coct.ListOfListsView,
	app_news: coct.AppNewsView
};

var push = Array.prototype.push;

var BrowseLevView = spv.inh(View, {}, {
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
	}
});


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
	children_views: {
		map_slice: {
			main: BrowseLevView,
			detailed: BrowseLevView
		},
		navigation: BrowseLevNavView
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

		"search_query": function(target, state) {
			target.search_input.val(state || '');
		}

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

		this.all_queues = [];
		var addQueue = function() {
			this.reverse_default_prio = true;
			_this.all_queues.push(this);
			return this;
		};
		var resortQueue = function(queue) {
			_this.resortQueue(queue);
		};

		this.lfm_imgq = new FuncsQueue({
			time: [700],
			init: addQueue,
			resortQueue: resortQueue
		});
		this.dgs_imgq = new FuncsQueue({
			time: [1200],
			init: addQueue,
			resortQueue: resortQueue
		});

		this.dgs_imgq_alt = new FuncsQueue({
			time: [250],
			init: addQueue,
			resortQueue: resortQueue
		});


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
		alb_prev_big: function() {
			return this.els.ui_samples.children('.album_preview-big');
		},
		'people-list-item': function() {
			return this.els.ui_samples.children('ul').children('.people-list-item');
		},
		'song-view': function() {
			return this.els.ui_samples.children('ul').children('.song-view');
		},
		artcard: function() {
			return this.els.ui_samples.children('.art_card');
		},
		lfm_authsampl: function() {
			return this.els.ui_samples.children('.lfm-auth-module');
		},
		lfm_scrobling: function() {
			return this.els.ui_samples.children('.scrobbling-switches');
		}
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
			if (typeof documentScrollSizeChangeHandler == 'function'){
				var newsize = detectSize(getCurrentNode());

				if (oldsize != newsize){
					if (typeof offset_top == 'undefined'){
						var offset = $(getCurrentNode()).offset();
						offset_top = (offset && offset.top) || 0;
					}
					documentScrollSizeChangeHandler((oldsize = newsize) + offset_top);
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
			_this.els.search_form.find('#app_type').val(app_env.app_type);

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

				_this.arrowsKeysNav(e);
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
	inputs_names: ['input'],
	key_codes_map:{
		'13': 'Enter',
		'37': 'Left',
		'39': 'Right',
		'40': 'Down',
		'63233': 'Down',
		'38': 'Up',
		'63232': 'Up'
	},
	arrowsKeysNav: function(e) {
		var
			key_name,
			_key = e.keyCode;

		var allow_pd;
		if (this.inputs_names.indexOf(e.target.nodeName.toLowerCase()) == -1){
			allow_pd = true;
		}
		key_name = this.key_codes_map[e.keyCode];

		if (key_name && allow_pd){
			e.preventDefault();
		}
		if (key_name){
			//this.RPCLegacy('keyNav', key_name);
			this.wp_box.wayPointsNav(key_name, e);
		}
	},
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

	appendStyle: function(style_text){
		//fixme - check volume ondomready
		var style_node = this.d.createElement('style');
			style_node.setAttribute('title', 'button_menu');
			style_node.setAttribute('type', 'text/css');

		if (!style_node.styleSheet){
			style_node.appendChild(this.d.createTextNode(style_text));
		} else{
			style_node.styleSheet.cssText = style_text;
		}

		this.d.documentElement.firstChild.appendChild(style_node);

	},
	verticalAlign: function(img, opts){
		//target_height, fix
		var real_height = opts.real_height || (img.naturalHeight ||  img.height);
		if (real_height){
			var offset = (opts.target_height - real_height)/2;

			if (offset){
				if (opts.animate){
					$(img).animate({'margin-top':  offset + 'px'}, opts.animate_time || 200);
				} else {
					$(img).css({'margin-top':  offset + 'px'});
				}

			}
			return offset;
		}
	},
	preloadImage: function(src, alt, callback, place){
		var image = window.document.createElement('img');
		if (alt){
			image.alt= alt;
		}

		image.onload = function(){
			if (callback){
				callback(image);
			}
		};
		if (place){
			$(place).append(image);
		}
		image.src = src;
		if (image.complete){
			setTimeout(function(){
				if (callback){
					callback(image);
				}
			}, 10);

		}
		return image;
	},
	trackEvent: function() {
		var args = Array.prototype.slice.apply(arguments);
		args.unshift('trackEvent');
		this.RPCLegacy.apply(this, args);
	},
	getAcceptedDesc: function(rel){
		var link = rel.info.domain && ('https://vk.com/' + rel.info.domain);
		if (link && rel.info.full_name){
			return $('<a class="external"></a>').attr('href', link).text(rel.info.full_name);
		}  else if (rel.item.est){
			return $("<span class='desc'></span>").text(app_serv.getRemainTimeText(rel.item.est, true));
		}
	},
	bindLfmTextClicks: function(con) {
		var _this = this;
		con.on('click', 'a', function(e) {
			var node = $(this);
			var link = node.attr('href');
			if (node.is('.bbcode_artist')){
				e.preventDefault();

				var artist_name = decodeURIComponent(link.replace('http://www.last.fm/music/','').replace(/\+/g, ' '));
				_this.root_view.showArtcardPage(artist_name);
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
	loadImage: function(opts) {
		if (opts.url){
			var queue;
			if (opts.url.indexOf('last.fm') != -1){
				queue = this.lfm_imgq;
			} else if (opts.url.indexOf('discogs.com') != -1) {
				queue = this.dgs_imgq;
			} else if (opts.url.indexOf('http://s.pixogs.com') != -1) {
				queue = this.dgs_imgq_alt;
			}
			opts.timeout = opts.timeout || 40000;
			opts.queue = opts.queue || queue;
			return view_serv.loadImage(opts);
		}
	},
	createNiceButton: function(position){
		var c = $('<span class="button-hole"><a class="nicebutton"></a></span>');
		var b = c.children('a');

		if (position == 'left'){
			c.addClass('bposition-l');
		} else if (position == 'right'){
			c.addClass('bposition-r');
		}

		var bb = {
			c: c,
			b: b,
			_enabled: true,
			enable: function(){
				if (!this._enabled){
					this.b.addClass('nicebutton').removeClass('disabledbutton');
					this.b.data('disabled', false);
					this._enabled = true;
				}
				return this;

			},
			disable: function(){
				if (this._enabled){
					this.b.removeClass('nicebutton').addClass('disabledbutton');
					this.b.data('disabled', true);
					this._enabled = false;
				}
				return this;
			},
			toggle: function(state){
				if (typeof state != 'undefined'){
					if (state){
						this.enable();
					} else {
						this.disable();
					}
				}

			}
		};
		bb.disable();
		return bb;
	}
});

AppView.AppExposedView = AppExposedView;
return AppView;
});
