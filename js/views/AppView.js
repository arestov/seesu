define(['provoda', 'spv', 'jquery', 'app_serv', 'js/libs/FuncsQueue', './nav', './coct' ,'./uacq',
'./StartPageView', './SearchPageView', './ArtcardUI', './TagsListPage', './ArtistListView',
'./SongsListView', './UserCardPage', './MusicConductorPage', './TagPageView' ,'./YoutubeVideoView',
'./lul', './SongcardPage', './AppBaseView', './modules/WPBox'],
function(provoda, spv, $, app_serv, FuncsQueue, nav, coct, uacq,
StartPageView, SearchPageView, ArtcardUI, TagsListPage, ArtistListView,
SongsListView, UserCardPage, MusicConductorPage, TagPageView, YoutubeVideoView,
lul, SongcardPage, AppBaseView, WPBox) {
"use strict";
var app_env = app_serv.app_env;
var localize = app_serv.localize;



var AppView = function(){};
AppBaseView.extendTo(AppView, {
	children_views: {
		start_page : {
			main: StartPageView,
			nav: nav.StartPageNavView
		},
		invstg: {
			main: SearchPageView,
			nav: nav.investgNavUI
		},
		artcard: {
			main: ArtcardUI,
			nav: nav.baseNavUI
		},

		artslist: {
			main: ArtistListView,
			nav: nav.baseNavUI
		},
		playlist: {
			main: SongsListView,
			'all-sufficient-details': SongsListView.SongsListDetailedView,
			nav: nav.baseNavUI
		},
		vk_usercard: {
			nav: nav.baseNavUI,
			main: UserCardPage.VkUsercardPageView
		},
		lfm_usercard:{
			nav: nav.baseNavUI,
			main: UserCardPage.LfmUsercardPageView
		},
		usercard: {
			nav: nav.baseNavUI,
			main: UserCardPage
		},
		song: {
			nav: nav.baseNavUI
		},
		allplaces: {
			nav: nav.baseNavUI,
			main: coct.ListOfListsView
		},
		mconductor: {
			nav: nav.baseNavUI,
			main: MusicConductorPage
		},
		tag_page: {
			main: TagPageView,
			nav: nav.baseNavUI
		},
		tagslist: {
			main: TagsListPage,
			nav: nav.baseNavUI
		},
		user_playlists: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		songs_lists: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		artists_lists:{
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		сountries_list: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		city_place: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		cities_list: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		country_place: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		tag_artists: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		tag_songs: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		youtube_video: {
			main: YoutubeVideoView,
			nav: nav.baseNavUI
		},
		vk_users:{
			main: UserCardPage.VkUsersPageView,
			nav: nav.baseNavUI
		},
		lfm_users:{
			main: lul.LfmUsersPageView,
			nav: nav.baseNavUI
		},
		lfm_listened_artists: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		lfm_listened_tracks: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		lfm_listened_albums: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		lfm_listened_tags: {
			main: lul.UserTagsPageView,
			nav: nav.baseNavUI
		},
		listoflists: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		lfm_user_tag: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		user_acqs_list: {
			main: uacq.UserAcquaintancesListView,
			nav: nav.baseNavUI
		},
		albslist: {
			main: coct.AlbumsListView,
			nav: nav.baseNavUI
		},
		lula: {
			main: lul.LULAPageVIew,
			nav: nav.baseNavUI
		},
		lulas: {
			main: lul.LULAsPageVIew,
			nav: nav.baseNavUI
		},
		songcard: {
			main: SongcardPage,
			nav: nav.baseNavUI
		},
		songcard_cloudcasts: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		cloudcasts_list: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		blogs_conductor: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		blogs_list: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		},
		music_blog: {
			main: coct.ListOfListsView,
			nav: nav.baseNavUI
		}
		
	},
	'collch-current_mp_md': function(name, value) {
		this.updateState('current_mp_md', value._provoda_id);
	},
	'collch-navigation': {
		place: 'nav.daddy',
		space: 'nav',
		by_model_name: true
	},


	'spec-vget-song': function(md) {
		var playlist = md.getParentMapModel();
		var playlist_mpx = playlist.mpx;
		var playlist_view = this.getChildView(playlist_mpx, 'all-sufficient-details');
		return playlist_view && playlist_view.getChildView(md.mpx);
	},
	'collch-$spec-song': function(name, md) {
		var playlist = md.getParentMapModel();

		var playlist_mpx = playlist.mpx;

		var view = this.getChildView(playlist_mpx, 'all-sufficient-details');
		if (!view){
			view = this.getFreeChildView({name: playlist.model_name, space: 'all-sufficient-details'}, playlist);
			var place = AppBaseView.viewOnLevelP.call(this, {map_level_num: md.map_level_num}, view);
			place.append(view.getA());
			this.requestAll();
		}
	},
	'collch-$spec-playlist': {
		place: AppBaseView.viewOnLevelP,
		opts: {overview: true}
	},
	tickCheckFocus: function() {
		if (this.isAlive()){
			this.search_input[0].focus();
			this.search_input[0].select();
		}
	},
	'collch-start_page': function(name, md) {
		var view = this.getFreeChildView({name: name, space: 'main'}, md);
		if (view){
			var _this = this;

			var checkFocus = function(state) {
				if (state){
					_this.nextTick(_this.tickCheckFocus);
					
				}
			};

			view.on('state_change-autofocus', function(e) {
				checkFocus(e.value);
			}, {immediately: true});
		}
		this.requestAll();
	},
	'stch-full_page_need': function(state) {
		this.els.screens.toggleClass('full_page_need', !!state);
	},
	'stch-root-lev-search-form': function(state) {
		this.els.search_form.toggleClass('root-lev-search-form', !!state);
	},
	'stch-show_search_form': function(state) {
		this.els.search_form.toggleClass('hidden', !state);
		if (!state){
			this.search_input[0].blur();
		}
	},
	
	state_change: {
		"wait-vk-login": function(state) {
			this.toggleBodyClass(state, 'wait-vk-login');
		},
		"vk-waiting-for-finish": function(state){
			this.toggleBodyClass(state, 'vk-waiting-for-finish');
		},
		"slice-for-height": function(state){
			this.toggleBodyClass(state, 'slice-for-height');
		},
		"deep-sandbox": function(state){
			this.toggleBodyClass(state, 'deep-sandbox');
		},

		"search_query": function(state) {
			this.search_input.val(state || '');
		},
		playing: function(state) {
			if (app_env.need_favicon){
				if (state){
					this.changeFavicon('playing');
				} else {
					this.changeFavicon('usual');
				}
			}
		}
		
	},
	'compx-now_playing_text': {
		depends_on: ['now_playing'],
		fn: function(text) {
			return localize('now_playing','Now Playing') + ': ' + text;
		}
	},
	remove: function() {
		this._super();
		if (this.d){
			if (this.d.body && this.d.body.firstChild && this.d.body.firstChild.parentNode){
				$(this.d.body).off().find('*').remove();
				
			}
			$(this.d).off();
			$(this.d).remove();
		}
		
		
		this.d = null;
		this.search_input = null;
		this.nav = null;
	},
	createDetails: function(){
		this._super();
		var _this = this;
		this.wp_box = new WPBox();
		this.wp_box.init(this);
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
			time: [170],
			init: addQueue,
			resortQueue: resortQueue
		});

		setTimeout(function() {
			spv.domReady(_this.d, function() {
				_this.buildAppDOM();
			});
		});

		if (this.opts.can_die && spv.getDefaultView(this.d)){
			this.can_die = true;
			this.checkLiveState = function() {
				if (!spv.getDefaultView(_this.d)){
					_this.reportDomDeath();
					return true;
				}
			};

			this.lst_interval = setInterval(this.checkLiveState, 1000);

		}
		
		this.on('die', function() {
			this.RPCLegacy('detachUI', this.view_id);
		});

		this.on('vip_state_change-current_mp_md', function() {
			var cwp = this.state('vis_current_wpoint');
			if (cwp){
				if (cwp.canUse && !cwp.canUse()){
					_this.setVisState('current_wpoint', false);
				}
			}

		}, {skip_reg: true, immediately: true});

		this.on('state_change-current_mp_md', function() {
			_this.resortQueue();
		});



		var wd = this.getWindow();
		var checkWindowSizes = spv.debounce(function() {
			_this.updateManyStates({
				window_height: wd.innerHeight,
				window_width: wd.innerWidth
			});
		}, 150);

		spv.addEvent(wd, 'resize', checkWindowSizes);

		//$(wd).on('resize', checkWindowSizes);
		this.onDie(function(){
			spv.removeEvent(wd, 'resize', checkWindowSizes);
			//$(wd).off('resize', checkWindowSizes);
			$(wd).off();
			$(wd).remove();
			wd = null;
			_this = null;
		});

	},
	'compx-window_demensions_key': {
		depends_on: ['window_width', 'window_height'],
		fn: function(window_width, window_height) {
			return window_width + '-' + window_height;
		}
	},
	resortQueue: function(queue) {
		if (queue){
			queue.removePrioMarks();
		} else {
			for (var i = 0; i < this.all_queues.length; i++) {
				this.all_queues[i].removePrioMarks();
			}
		}
		var md = this.getNesting('current_mp_md');
		var view = md && md.mpx.getRooConPresentation(true);
		if (view){
			view.setPrio();
		}
	},
	onDomBuild: function() {
		this.c = $(this.d.body);

		this.c.addClass('app-loaded');
		var ext_search_query = this.els.search_input.val();
		//must be before start_page view set its value to search_input
		this.RPCLegacy('checkUserInput', {
			ext_search_query: ext_search_query
		});

		this.completeDomBuilding();


	},
	reportDomDeath: function() {
		if (this.can_die && !this.dead){
			this.dead = true;
			clearInterval(this.lst_interval);
		//	var d = this.d;
		//	delete this.d;
			this.die();
			console.log('DOM dead! ' + this.nums);

		}
	},
	isAlive: function(){
		if (this.dead){
			return false;
		}
		return !this.checkLiveState || !this.checkLiveState();
	},
	
	
	
	
	toggleBodyClass: function(add, class_name){
		if (add){
			this.c.addClass(class_name);
		} else {
			this.c.removeClass(class_name);
		}
	},
	changeFaviconNode: function(d, src, type) {
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
	},
	changeFavicon: spv.debounce(function(state){
		if (this.isAlive()){
			if (state && this.favicon_states[state]){
				this.changeFaviconNode(this.d, this.favicon_states[state], 'image/png');
			} else{
				this.changeFaviconNode(this.d, this.favicon_states['usual'], 'image/png');
			}
		}

	},300),
	favicon_states: {
		playing: 'icons/icon16p.png',
		usual: 'icons/icon16.png'
	},
	parts_builder: {
		//samples
		alb_prev_big: function() {
			return this.els.ui_samples.children('.album_preview-big');
		},
		'song-view': function() {
			return this.els.ui_samples.children('ul').children('.song-view');
		},
		artcard: function() {
			return this.els.ui_samples.children('.art_card');
		},
		track_c: function() {
			return this.els.ui_samples.children('.track-context');
		},
		lfm_authsampl: function() {
			return this.els.ui_samples.children('.lfm-auth-module');
		},
		lfm_scrobling: function() {
			return this.els.ui_samples.children('.scrobbling-switches');
		}
	},
	handleStartScreen: function(start_screen) {
		var st_scr_scrl_con = start_screen.parent();
		var start_page_wrap = st_scr_scrl_con.parent();
		var tpl = new this.PvTemplate({
			node: start_page_wrap,
			spec_states: {
				'$lev_num': -1
			}
		});

		this.tpls.push(tpl);

		this.lev_containers[-1] = {
			c: start_page_wrap,
			material: start_screen,
			scroll_con: st_scr_scrl_con
		};
	},
	buildAppDOM: function() {
		var _this = this;
		var d = this.d;


		var wd = this.getWindow();
		_this.updateManyStates({
			window_height: wd.innerHeight,
			window_width: wd.innerWidth
		});
		
			console.log('dom ready');
			_this.dom_related_props.push('els');

			var slider = d.getElementById('slider');
			var screens_block = $('#screens',d);


			if (app_env.check_resize){
				var detectSize = function(D){
					if (!D){
						return 0;
					} else {
						return $(D).outerHeight();
					}

					//return Math.max(D.scrollHeight, D.offsetHeight, D.clientHeight);
				};
				var getCurrentNode = function() {
					var current_md = _this.getNesting('current_mp_md');
					return current_md && current_md.mpx.getRooConPresentation(true, true).getC();
				};

				var readySteadyResize = function(){
					if (_this.rsd_rz){
						clearInterval(_this.rsd_rz);
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

					_this.rsd_rz = setInterval(recheckFunc,100);
					_this.on('vip_state_change-current_mp_md.resize-check', function() {
						recheckFunc();
					}, {
						exlusive: true,
						immediately: true
					});
				};
				readySteadyResize();

			}



			var ui_samples = $('#ui-samples',d);


			var search_form = $('#search',d);

			
			var app_map_con = screens_block.children('.app_map_con');


			//var shared_parts_c = app_map_con.children('.shared-parts');

			var scrolling_viewport;
			if (app_env.as_application){
				scrolling_viewport = {
					node: screens_block
				};
			} else {
				if (app_env.lg_smarttv_app){
					scrolling_viewport = {
						node: $(slider)
					};
				} else {
					scrolling_viewport = {
						node: $(d.body),
						offset: true
					};
				}

				/*
				*/
			}

			var start_screen = $('#start-screen',d);
			_this.handleStartScreen(start_screen);
			spv.cloneObj(_this.els, {
				ui_samples: ui_samples,
				screens: screens_block,
				app_map_con: app_map_con,
				scrolling_viewport: scrolling_viewport,
				slider: slider,
				navs: $(slider).children('.navs'),
				start_screen: start_screen,
				search_input: $('#q',d),
				search_form: search_form,
				pestf_preview: start_screen.children('.personal-stuff-preview')
			});



			_this.els.search_form.find('#app_type').val(app_env.app_type);

			_this.els.search_form.submit(function(){return false;});


			_this.search_input = _this.els.search_input;

			_this.search_input.on('keyup change', function() {
				var input_value = this.value;
				_this.overrideStateSilently('search_query', input_value);
				_this.RPCLegacy('search', input_value);
			});




			$('#widget-url',d).val(location.href.replace('index.html', ''));


			if (app_env.bro.browser.opera && ((typeof window.opera.version == 'function') && (parseFloat(window.opera.version()) <= 10.1))){

				$('<a id="close-widget">&times;</a>',d)
					.click(function(){
						window.close();
					})
					.prependTo(_this.els.slider);
			}



			var vklc = ui_samples.children('.vk-login-context');

			spv.cloneObj(_this.samples, {
				vklc: vklc,
				vk_login: {
					o: vklc,
					oos: $(),
					hideLoadIndicator: function(){
						this.oos.removeClass('waiting-auth');
						this.load_indicator = false;
					},
					showLoadIndicator:function() {
						this.oos.addClass('waiting-auth');
						this.load_indicator = true;
					},
					remove: function(){
						this.oos.remove();
						this.oos = $();
						su.vk.wait_for_finish = false;
					},
					resetAuth: function(){
						this.oos.find('.auth-container').empty();
					},
					finishing: function(){
						su.vk.wait_for_finish = true;

						this.oos.addClass('vk-finishing');
					},
					vk_login_error: $(),
					captcha_img: $(),
					clone: function(request_description){
						var _this = this;
						var nvk = this.o.clone();
						if (su.vk.wait_for_finish){
							nvk.addClass('vk-finishing');
						}


						if (this.load_indicator){
							nvk.addClass('waiting-auth');
						}
						if (request_description){
							nvk.find('.login-request-desc').text(request_description);
						}
						var auth_c =  nvk.find('.auth-container');
						nvk.find('.sign-in-to-vk').click(function(e){
							var class_name = this.className;
							var clicked_node = $(this);

							var vkdomain = class_name.match(/sign-in-to-vk-ru/) ? 'vkontakte.ru' : 'vk.com';
							if (su.vk_app_mode){
								if (window.VK){
									VK.callMethod('showSettingsBox', 8);
								}
							} else{

								su.vk_auth.requestAuth({
									ru: class_name.match(/sign-in-to-vk-ru/) ? true: false,
									c: _this
								});

							}


							e.preventDefault();
						});
						var input = nvk.find('.vk-code');
						nvk.find('.use-vk-code').click(function() {
							var vk_t_raw = input.val();
							_this.RPCLegacy('vkSessCode', vk_t_raw);
						});

						_this.oos =  _this.oos.add(nvk);
						return nvk;
					}
				}

			});

			//_this.els.search_label = _this.els.search_form.find('#search-p').find('.lbl');

			var justhead = _this.els.navs;
			var daddy = justhead.children('.daddy');
			var np_button = daddy.children('.np-button');
			_this.nav = {
				justhead: justhead,
				daddy: daddy,
				np_button: np_button.remove()
			};

			_this.nav.daddy.empty().removeClass('not-inited');


			var npbClickCallback = function(){
				_this.RPCLegacy('showNowPlaying');
			};
			np_button.click(npbClickCallback);

			_this.onDie(function() {
				np_button.off();
			});

			_this.addWayPoint(np_button, {
				canUse: function() {
					return !_this.state('viewing_playing');
				}
			});

			var nptpl = new _this.PvTemplate({
				node: np_button
			});
			_this.tpls.push(nptpl);

			daddy.append(np_button);
			var d_click_callback = function(e) {
				e.preventDefault();
				app_env.openURL($(this).attr('href'));
				seesu.trackEvent('Links', 'just link');
			};

			$(d).on('click', '.external', d_click_callback);
			_this.onDie(function() {
				$(d).off('click', d_click_callback);
			});

			_this.onDomBuild();


			var kd_callback = function(e){
				if (d.activeElement && d.activeElement.nodeName == 'BUTTON'){return;}
				_this.arrowsKeysNav(e);
			};

			$(d).on('keydown', kd_callback);

			_this.onDie(function() {
				$(d).off('keydown', kd_callback);
			});

			_this.RPCLegacy('attachUI', this.view_id);

			_this.onDie(function() {
				_this = null;
				d = null;
			});
	},
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
			this.wp_box.wayPointsNav(key_name);
		}
	},
	scrollToWP: function(cwp) {
		if (cwp){
			var cur_md_md = this.getNesting('current_mp_md');
			var parent_md = cur_md_md.getParentMapModel();
			if (parent_md && cwp.view.getAncestorByRooViCon('main') == parent_md.mpx.getRooConPresentation()){
				this.scrollTo($(cwp.node), {
					node: this.getLevByNum(parent_md.map_level_num).scroll_con
				}, {vp_limit: 0.6, animate: 117});
			}
			this.scrollTo($(cwp.node), false, {vp_limit: 0.6, animate: 117});
		}
	},
	'stch-vis_current_wpoint': function(nst, ost) {
		if (ost){
			$(ost.node).removeClass('surf_nav');
		}
		if (nst) {
			$(nst.node).addClass('surf_nav');
			//if (nst.view.getRooConPresentation() ==)

			this.scrollToWP(nst);

			//
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
		var image = document.createElement('img');
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
	getAcceptedDesc: function(rel){
		var link = rel.info.domain && ('https://vk.com/' + rel.info.domain);
		if (link && rel.info.full_name){
			return $('<a class="external"></a>').attr('href', link).text(rel.info.full_name);
		}  else if (rel.item.est){
			return $("<span class='desc'></span>").text(su.getRemainTimeText(rel.item.est, true));
		}
	},
	

	create_youtube_video: function(id){
		var youtube_video = document.createElement('embed');
		if (!app_env.chrome_like_ext){
			if (app_env.opera_widget){
				youtube_video.setAttribute('wmode',"transparent");
			} else if (app_env.opera_extension){
				youtube_video.setAttribute('wmode',"opaque");
			}
		}
		

		youtube_video.setAttribute('type',"application/x-shockwave-flash");
		youtube_video.setAttribute('src', 'https://www.youtube.com/v/' + id + '&autoplay=1');
		youtube_video.setAttribute('allowfullscreen',"true");
		youtube_video.setAttribute('class',"you-tube-video");

		return youtube_video;
	},
	bindLfmTextClicks: function(con) {
		con.on('click', 'a', function(e) {
			var node = $(this);
			var link = node.attr('href');
			if (node.is('.bbcode_artist')){
				e.preventDefault();

				var artist_name = decodeURIComponent(link.replace('http://www.last.fm/music/','').replace(/\+/g, ' '));
				su.showArtcardPage(artist_name);
				seesu.trackEvent('Artist navigation', 'bbcode_artist', artist_name);
			} else if (node.is('.bbcode_tag')){
				e.preventDefault();

				var tag_name = decodeURIComponent(link.replace('http://www.last.fm/tag/','').replace(/\+/g, ' '));
				su.show_tag(tag_name);
				seesu.trackEvent('Artist navigation', 'bbcode_tag', tag_name);
			} else {
				e.preventDefault();
				app_env.openURL(link);
				seesu.trackEvent('Links', 'just link');
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
			return app_serv.loadImage(opts);
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

return AppView;
});
