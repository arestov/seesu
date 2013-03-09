var viewOnLevelP = function(md, view) {
	var lev_conj = this.getLevelContainer(md.map_level_num, view);
	view.wayp_scan_stop = true;
	return lev_conj.material;
};

var appModelView = function(){};
provoda.View.extendTo(appModelView, {

	createDetailes: function(){
		this.root_view = this;
		this.d = this.opts.d;

		this.lfm_imgq = new funcsQueue(700);
		this.dgs_imgq = new funcsQueue(1200);
		var _this = this;
		setTimeout(function() {
			_this.buildAppDOM();
		});
		
		if (this.opts.can_die && getDefaultView(this.d)){
			this.can_die = true;
			this.checkLiveState = function() {
				if (!getDefaultView(_this.d)){
					_this.reportDomDeath();
					return true;
				}
			};

			this.lst_interval = setInterval(this.checkLiveState, 1000);
			
		}
		this.lev_containers = {};
		
		this.on('vip-state-change.current_mp_md', function(e) {
			var cwp = this.state('vis_current_wpoint');
			if (cwp){
				if (cwp.canUse && !cwp.canUse()){
					_this.setVisState('current_wpoint', false);
				}
			}
			
		}, {skip_reg: true, immediately: true});
		
	},
	onDomBuild: function() {
		this.c = $(this.d.body);

		this.c.addClass('app-loaded');
		this.connectStates();
		this.connectChildrenModels();

		
		var ext_search_query = this.els.search_input.val();
		//must be before start_page view set its value to search_input

		this.requestAll();
		this.md.checkUserInput({
			ext_search_query: ext_search_query
		});
		
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
	getLevelContainer: function(num, view) {
		if (this.lev_containers[num]){
			return this.lev_containers[num];
		} else {
			/*
			if (!view){
				throw new Error('give me "view"');
			}*/
			if (num == -1){
				throw new Error('start_screen must exist');
			}

			var container = $('<div class="complex-page inactive-page"></div>').addClass('index-of-cp-is-' + num);
			var scroll_con = $('<div class="complex-page-scroll_con"></div>').appendTo(container);
			var material = $('<div class="complex-page_material"></div>').appendTo(scroll_con);

			return this.lev_containers[num] = {
				c: container.appendTo(this.els.screens),
				scroll_con: scroll_con,
				material: material
			};
		}
	},
	children_views: {
		start_page : {
			main: StartPageView,
			nav: StartPageNavView
		},
		invstg: {
			main: searchPageView,
			nav: investgNavUI
		},
		artcard: {
			main: artCardUI,
			nav: baseNavUI
		},

		artslist: {
			main: ArtistListView,
			nav: baseNavUI
		},
		playlist: {
			main: songsListView,
			details: songsListView,
			nav: baseNavUI
		},
		usercard: {
			nav: baseNavUI,
			main: UserCardPage
		},
		song: {
			nav: baseNavUI
		},
		songswagon: {
			nav: baseNavUI
		},
		artistswagon: {
			nav: baseNavUI
		},
		tagswagon: {
			nav: baseNavUI
		},
		allptrain: {
			nav: baseNavUI
		},
		countytrain: {
			nav: baseNavUI
		},
		citytrain: {
			nav: baseNavUI
		},
		mconductor: {
			nav: baseNavUI
		},
		tag_page: {
			main: TagPageView,
			nav: baseNavUI
		},
		tagslist: {
			main: TagsListPage,
			nav: baseNavUI
		},
		user_playlists: {
			main: ListOfListsView,
			nav: baseNavUI
		},
		tag_artists: {
			main: ListOfListsView,
			nav: baseNavUI
		},
		tag_songs: {
			main: ListOfListsView,
			nav: baseNavUI
		},
		youtube_video: {
			main: YoutubeVideoView,
			nav: baseNavUI
		},
		user_acqs_list: {
			main: UserAcquaintancesListView,
			nav: baseNavUI
		},
		albslist: {
			main: AlbumsListView,
			nav: baseNavUI
		}
	},
	'collch-tagslist': {
		place: viewOnLevelP
	},
	'collch-albslist': {
		place: viewOnLevelP
	},
	'collch-user_acqs_list': {
		place: viewOnLevelP
	},
	'collch-youtube_video': {
		place: viewOnLevelP
	},
	'collch-tag_songs': {
		place: viewOnLevelP
	},
	'collch-user_playlists': {
		place: viewOnLevelP
	},
	'collch-tag_artists': {
		place: viewOnLevelP
	},
	'collch-tag_page': {
		place: viewOnLevelP
	},
	'collch-usercard': {
		place: viewOnLevelP
	},
	'collch-invstg': {
		place: viewOnLevelP
	},
	'collch-artcard':  {
		place: viewOnLevelP
	},
	'collch-artslist': {
		place: viewOnLevelP
	},
	'collch-playlist': [
		{
			place: viewOnLevelP,
			opts: {overview: true}
		},
		{
			place: function(md, view){
				var lev_conj = this.getLevelContainer(md.map_level_num + 1, view);
				view.wayp_scan_stop = true;
				return lev_conj.material;
			},
			space: 'details'
		}
	],
	'collch-start_page': function(name, md) {
		var view = this.getFreeChildView(name, md, 'main');
		if (view){
			var _this = this;

			var checkFocus = function(opts) {
				if (opts){
					if (opts.userwant){
						_this.search_input[0].focus();
						_this.search_input[0].select();
					} else {
						_this.search_input[0].blur();
					}
					
				}
			};
			checkFocus(view.state('mp_show-end'));

			view.on('state-change.mp_show-end', function(e) {
				checkFocus(e.value);
			});
		}
		this.requestAll();
	},
	'collch-navigation': {
		place: 'nav.daddy',
		space: 'nav',
		by_model_name: true
	},
	manual_states_connect: true,
	getLevByNum: function(num, exclude_start_lev) {
		if (num < -1){
			return false;
		} else if (exclude_start_lev){
			return num == -1 ? false : this.getLevelContainer(num);
		} else {
			return this.getLevelContainer(num);
		}
		
	},
	hideLevNum: function(num) {

		var levc = this.getLevByNum(num);
		if (levc){
			levc.c.addClass('inactive-page').removeClass('full-page');
		}
		
	},
	showLevNum: function(num) {
		var levc = this.getLevByNum(num);
		if (levc){
			levc.c.removeClass('inactive-page').addClass('full-page');
		}
		
	},
	removePageOverviewMark: function(num) {
		var levc = this.getLevByNum(num);
		if (levc){
			levc.c.removeClass('page-scheme');
		}
	},
	addPageOverviewMark: function(num) {
		var levc = this.getLevByNum(num);
		if (levc){
			levc.c.addClass('page-scheme');
		}
	},
	complex_states: {
		'start-level': {
			depends_on: ['current_mp_md'],
			fn: function(md) {
				if (!md || md.map_level_num == -1){
					return true;
				}
			}
		}
	},
	'stch-full_page_need': function(state) {
		this.els.screens.toggleClass('full_page_need', !!state);
	},
	'stch-start-level': function(state) {
		//this.els.start_screen.toggleClass('inactive-page', !state);
	},
	//
	'stch-current_mp_md': function(md, old_md) {

		//map_level_num
		//md.map_level_num
		var oved_now_active = old_md && (old_md.map_level_num-1 ===  md.map_level_num);
		if (old_md){
			this.hideLevNum(old_md.map_level_num);
			if (!oved_now_active){
				this.removePageOverviewMark(old_md.map_level_num-1);
			}
		}
		if (md.map_level_num != -1 && (!old_md || old_md.map_level_num != -1)){
			this.hideLevNum(-1);
		}
		
		this.addPageOverviewMark(md.map_level_num - 1);
		this.showLevNum(md.map_level_num);
		if (oved_now_active){
			this.removePageOverviewMark(old_md.map_level_num-1);
		}
		/*
		var highlight = md.state('mp-highlight');
		if (highlight && highlight.source_md){
			var source_md = highlight.source_md;

			var md_view = this.getChildView(md, 'main');
			if (md_view){
				var hl_view = md_view.getChildView(source_md, 'main');
				if (hl_view){
					//this.scrollTo(hl_view.getC());
				}
			}
		}*/
		/*

		var ov_md = md.getParentMapModel();
		var ov_highlight = ov_md && ov_md.state('mp-highlight');
		if (ov_highlight && ov_highlight.source_md){
			var source_md = ov_highlight.source_md;
			var mplev_item_view = source_md.getRooConPresentation();
			if (mplev_item_view){
				this.scrollTo(mplev_item_view.getC(), {
					node: this.getLevByNum(md.map_level_num - 1).scroll_con
				}, {vp_limit: 0.4, animate: 117});
			}

			
		}*/
		var parent_md = md.getParentMapModel();
		if (parent_md){
			var mplev_item_view = md.getRooConPresentation();
			if (mplev_item_view){
				this.scrollTo(mplev_item_view.getC(), {
					node: this.getLevByNum(md.map_level_num - 1).scroll_con
				}, {vp_limit: 0.4, animate: 117});
			}
		}


		//var parent_md = md.getParentMapModel();
		//this.getChildView()
	},
	'stch-map_animation': function(changes) {
		if (!changes){
			return;
		}
		var all_changhes = $filter(changes.array, 'changes');
		all_changhes = [].concat.apply([], all_changhes);
		
		for (var i = 0; i < all_changhes.length; i++) {
			var cur = all_changhes[i];

			if (cur.type == 'move-view'){
				cur.target.updateState('vis_mp_show', {
					anid: changes.anid,
					value: cur.value
				});
				//MUST UPDATE VIEW, NOT MODEL!!!!!
			} else if (cur.type == 'destroy'){
				this.removeChildViewsByMd(cur.target);
			}
			
		}
		console.log(all_changhes);
		/*
		for (var i = 0; i < array.length; i++) {
			var cur = array[i];
			var handler = this["animation-type"][cur.type];

			if (handler){
				handler.call(this, cur.target, cur.type);
			}
			//array[i]
		};*/
	},
	'stch-root-lev-search-form': function(state) {
		this.els.search_form.toggleClass('root-lev-search-form', !!state);
	},
	'stch-show_search_form': function(state) {
		this.els.search_form.toggleClass('hidden', !state);
	},
	"animation-type":{
		"mp_has_focus": function(target, state) {

		},
		"mp_show": function(target, state) {

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
		"viewing_playing": function(state) {
			if (this.now_playing_link){
				if (state){
					this.now_playing_link.removeClass("nav-button");
				} else {
					this.now_playing_link.addClass("nav-button");
				}
			}
		},
		"search_query": function(state) {
			this.search_input.val(state || '');
		},
		'now_playing': function(text) {

			var md = this.md;
			var _this = this;
			if (!this.now_playing_link && this.nav){
				this.now_playing_link = $('<a class="nav-item np-button"><span class="np"></span></a>').click(function(){
					md.showNowPlaying();
				}).appendTo(this.nav.daddy);

				this.addWayPoint(this.now_playing_link, {
					canUse: function() {
						return !_this.state('viewing_playing');
					}
				});
			}
			if (this.now_playing_link){
				this.now_playing_link.attr('title', (localize('now_playing','Now Playing') + ': ' + text));
			}
		},
		playing: function(state) {
			var s = this.now_playing_link;
			if (state){
				s.addClass('player-played');

				if (app_env.need_favicon){
					this.changeFavicon('playing');
				}
				
			} else {
				s.each(function(i, el){
					$(el).attr('class', el.className.replace(/\s*player-[a-z]+ed/g, ''));
				});
				if (app_env.need_favicon){
					this.changeFavicon('usual');
				}
				
			}
		},
		"doc_title": function(title) {
			this.d.title = title || "";
		}
	},
	getScrollVP: function() {
		return this.els.scrolling_viewport;
	},
	scrollTo: function(jnode, view_port, opts) {
		if (!jnode){return false;}
		opts = opts || {};
	//	if (!this.view_port || !this.view_port.node){return false;}

		//var scrollingv_port = ;

		//var element = view.getC();

	//	var jnode = $(view.getC());
		if (!jnode[0]){
			return;
		}

		var view_port_limit = opts.vp_limit || 1;

		var svp = view_port || this.getScrollVP(),
			scroll_c = svp.offset ? svp.node :  svp.node,
			scroll_top = scroll_c.scrollTop(), //top
			scrolling_viewport_height = svp.node.height(), //height
			padding = (scrolling_viewport_height * (1 - view_port_limit))/2,
			scroll_bottom = scroll_top + scrolling_viewport_height; //bottom

		var top_limit = scroll_top + padding,
			bottom_limit = scroll_bottom - padding;
		
		var node_position;
		var node_top_post =  jnode.offset().top;
		if (svp.offset){
			node_position = node_top_post;
		} else{
			//throw new Error('fix this!');
			var spv_top_pos = scroll_c.offset().top;
			node_position = scroll_top + (node_top_post - spv_top_pos);

			//node_position = jnode.position().top + scroll_top + this.c.parent().position().top;
		}

		var el_bottom = jnode.height() + node_position;

		var new_position;
		if ( el_bottom > bottom_limit || el_bottom < top_limit){
			new_position =  el_bottom - scrolling_viewport_height/2;
		}
		if (new_position){
			if (opts.animate){
				scroll_c
					.stop(false, true)
					.animate({
						scrollTop: new_position
					}, opts.animate);
				
			} else {
				scroll_c.scrollTop(new_position);
			}
			
		}
	},
	toggleBodyClass: function(add, class_name){
		if (add){
			this.c.addClass(class_name);
		} else {
			this.c.removeClass(class_name);
		}
	},
	changeFavicon: debounce(function(state){
		if (this.isAlive()){
			if (state && this.favicon_states[state]){
				changeFavicon(this.d, this.favicon_states[state], 'image/png');
			} else{
				changeFavicon(this.d, this.favicon_states['usual'], 'image/png');
			}
		}
		
	},300),
	favicon_states: {
		playing: 'icons/icon16p.png',
		usual: 'icons/icon16.png'
	},
	parts_builder: {
		//samples
		'moplas-block': function() {
			return this.els.ui_samples.children('.moplas-block');
		},
		user_page: function() {
			return this.els.ui_samples.children('.user_page');
		},
		tags_list_page: function() {
			return this.els.ui_samples.children('.tags_list_page');
		},
		tag_page: function() {
			return this.els.ui_samples.children('.tag_page');
		},
		alb_prev_big: function() {
			return this.els.ui_samples.children('.album_preview-big');
		},
		artcard: function() {
			return this.els.ui_samples.children('.art_card');
		},
		track_c: function() {
			return this.els.ui_samples.children('.track-context');
		},
		playlist_panel: function() {
			return this.els.ui_samples.children('.play-list-panel');
		},
		lfm_authsampl: function() {
			return this.els.ui_samples.children('.lfm-auth-module');
		},
		lfm_scrobling: function() {
			return this.els.ui_samples.children('.scrobbling-switches');
		},
		artists_list: function() {
			return this.els.ui_samples.children('.artists_list');
		},
		albums_page: function() {
			return this.els.ui_samples.children('.albums_page');
		},
		area_for_button: function() {
			return this.els.ui_samples.children('.area_for_button');
		}
	},
	getSample: function(name) {
		var sample_node = this.samples[name] || this.requirePart(name);

		return $(sample_node).clone();
	},
	buildAppDOM: function() {
		var _this = this;
		var d = this.d;
		domReady(this.d, function() {
			console.log('dom ready');
			

			

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
					var current_md = _this.state('current_mp_md');
					return current_md && current_md.getRooConPresentation(true, true).getC();
				};

				var readySteadyResize = function(){
					if (_this.md.rsd_rz){
						clearInterval(_this.md.rsd_rz);
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

					_this.md.rsd_rz = setInterval(recheckFunc,100);
					_this.on('vip-state-change.current_mp_md.resize-check', function(e) {
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
			

			var start_screen = $('#start-screen',d);

			
			var shared_parts_c = screens_block.children('.shared-parts');

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
			_this.els = {
				ui_samples: ui_samples,
				screens: screens_block,
				scrolling_viewport: scrolling_viewport,
				slider: slider,
				navs: $(slider).children('.navs'),
				start_screen: start_screen,
				search_input: $('#q',d),
				search_form: search_form,
				pestf_preview: start_screen.children('.personal-stuff-preview'),
				start_page_place: start_screen.children('.for-startpage')
			};

			var st_scr_scrl_con = start_screen.parent();

			_this.lev_containers[-1] = {
				c: st_scr_scrl_con.parent(),
				material: start_screen,
				scroll_con: st_scr_scrl_con
			};
				

			_this.els.search_form.find('#app_type').val(su.env.app_type);
			
			_this.els.search_form.submit(function(){return false;});
			
			
			_this.search_input = _this.els.search_input;
		
			_this.search_input.on('keyup change', function(e) {
				var input_value = this.value;
				_this.overrideStateSilently('search_query', input_value);
				_this.md.search(input_value);
			});

			/*
			jsLoadComplete({
				test: function() {
					return window.button_menu;
				},
				fn: function() {
					var buttmen =  ui_samples.children('.play-controls.buttmen');
					buttmen = new button_menu(buttmen, d);

					_this.appendStyle(buttmen.style);
					_this.els.play_controls = buttmen;

				}
			});*/
			
			
			$('#widget-url',d).val(location.href.replace('index.html', ''));
			

			if (app_env.bro.browser.opera && ((typeof window.opera.version == 'function') && (parseFloat(window.opera.version()) <= 10.1))){
				
				$('<a id="close-widget">&times;</a>',d)
					.click(function(){
						window.close();
					})
					.prependTo(_this.els.slider);
			}
			
			

			var vklc = ui_samples.children('.vk-login-context');

			_this.samples = {
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
							if (vk_t_raw){
								var vk_token = new vkTokenAuth(su.vkappid, vk_t_raw);
								su.connectVKApi(vk_token, true);
							}
						});
						
						_this.oos =  _this.oos.add(nvk);
						return nvk;
					}
				}
				
			};
			
			
			_this.els.search_label = _this.els.search_form.find('#search-p').find('.lbl');
			
			var justhead = _this.els.navs;
			_this.nav = {
				justhead: justhead,
				daddy: justhead.children('.daddy')
			};

			_this.nav.daddy.empty().removeClass('not-inited');
			

			$(d).on('click', '.external', function(e) {
				e.preventDefault();
				app_env.openURL($(this).attr('href'));
				seesu.trackEvent('Links', 'just link');
			});
			
		
			
			_this.onDomBuild();

			$(d).keydown(function(e){
				if (d.activeElement && d.activeElement.nodeName == 'BUTTON'){return;}
				_this.arrowsKeysNav(e);
			});
		});
	},
	arrowsKeysNav: function(e) {
		var
			key_name,
			_key = e.keyCode;

		if (_key == '13'){
			e.preventDefault();
			key_name = 'Enter';
		} else
		if (_key == '37'){
			e.preventDefault();
			key_name = 'Left';
		} else
		if (_key == '39'){
			e.preventDefault();
			key_name = 'Right';
		} else
		if((_key == '40') || (_key == '63233')){
			e.preventDefault();
			key_name = 'Down';
		} else
		if((_key == '38') || (_key == '63232')){
			e.preventDefault();
			key_name = 'Up';
		}
		if (key_name){
			//this.md.keyNav(key_name);
			this.wayPointsNav(key_name);
		}
	},
	getWPEndPoint: function(cur_wayp, nav_type, dems_storage) {
		var cur_dems = dems_storage[cur_wayp.wpid];
		var end_point = {};
		
		if (this.wp_dirs.horizontal[nav_type]){
			end_point.top = cur_dems.offset.top;
			if (this.wp_dirs.forward[nav_type]){
				end_point.left = cur_dems.offset.left;
			} else {
				end_point.left = cur_dems.offset.left + cur_dems.width;
			}
		} else {
			end_point.left = cur_dems.offset.left;
			if (this.wp_dirs.forward[nav_type]){
				end_point.top = cur_dems.offset.top;
			} else {
				end_point.top = cur_dems.offset.top + cur_dems.height;
			}
		}
		return end_point;
	},
	getWPDemsForStorage: function(cur_wayp, dems_storage) {
		if (!cur_wayp.wpid){
			throw new Error('waypoint must have ID (".wpid")');
		}
		var dems = this.getWPDems(cur_wayp);
		dems_storage[cur_wayp.wpid] = dems || {disabled: true};
		return dems;
	},
	getWPDems: function(cur_wayp) {
		
		if (cur_wayp.canUse && !cur_wayp.canUse()){
			return;
		}
		var cur = cur_wayp.node;
		var height = cur.height();
		if (!height){
			return;
		}
		var width = cur.width();
		if (!width){
			return;
		}

		var offset = cur.offset();
		if (!offset.top && !offset.left){
			return;
		}

		var dems = {
			height: height,
			width: width,
			offset: offset
		};


		if (cur_wayp.simple_check){
			return this.canUseWaypoint(cur_wayp, dems);
		} else {
			return dems;
		}
	},
	canUseWaypoint: function(cur_wayp, dems) {
		var cur = cur_wayp.node;

		if (cur.css('display') == 'none'){
			return;
		}

		var height = dems.height;
		var width = dems.width;
		
		var pos = cur.position();
		if ((pos.top + height) <= 0){
			return;
		}
		if ((pos.left + width) <= 0){
			return;
		}


		var parents = [];
		var p_cur = cur.parent();
		while (p_cur[0]){
			parents.push(p_cur);
			p_cur = p_cur.parent();
		}

		var break_of_disnone = false;
		for (var ii = 0; ii < parents.length; ii++) {
			if (parents[ii].css('display') == 'none'){
				break_of_disnone = true;
				break;
			}
			
		}
		if (break_of_disnone){
			return;
		}

		var stop_parents = [];
		var view_cur = cur_wayp.view;
		while (view_cur){
			if (view_cur.wayp_scan_stop){
				var con = view_cur.getC();
				if (con){
					stop_parents.push(con[0] || con);
				}
			}
			view_cur = view_cur.parent_view;
		}


		var ovh_parent = false;
		for (var ii = 0; ii < parents.length; ii++) {
			if (parents[ii].css('overflow') == 'hidden'){
				ovh_parent = parents[ii];
				break;
			}
			if (stop_parents.indexOf(parents[ii][0]) != -1){
				break;
			}
			
		}
		var offset = cur.offset();

		if (ovh_parent){
			var parent_offset = ovh_parent.offset();
			if ((offset.top + height) < parent_offset.top){
				return;
			}
			if ((offset.left + width) < parent_offset.left){
				return;
			}
			if (offset.top > (parent_offset.top + ovh_parent.height())){
				return;
			}
			if (offset.left > (parent_offset.left + ovh_parent.width())){
				return;
			}
			
		}

		return {
			height: height,
			width: width,
			offset: offset
		};
	},
	getWPPack: function(view, dems_storage) {
		var all_waypoints = view.getAllWaypoints();
		var wayp_pack = [];

		for (var i = 0; i < all_waypoints.length; i++) {
			var cur_wayp = all_waypoints[i];
			var cur = cur_wayp.node;
			var cur_id = cur_wayp.wpid;
			if (!dems_storage[cur_id]){
				var dems = this.getWPDemsForStorage(cur_wayp, dems_storage);
				if (!dems){
					continue;
				}
			}
			
			/*
			if (!dems){
				cur.data('dems', null);
				cloneObj(cur_wayp, {
					height: null,
					width: null,
					offset: null
				});
				continue;
			} else {
				cloneObj(cur_wayp, dems);
			}

			cur.data('dems', cur_wayp);
			*/
			if (!dems_storage[cur_id].disabled){
				wayp_pack.push(cur_wayp);
			}
			

			
		}
		var _this = this;

		wayp_pack.sort(function(a, b) {
			return sortByRules(a,b, [function(el) {
				var cur_dems = dems_storage[el.wpid];
				return _this.getLenthBtwPoints({left:0, top:0}, cur_dems.offset);
			}]);
		});

		return wayp_pack;
	},
	sortWPCorridor: function(target_dems, corridor, nav_type, dems_storage) {
		var start_point = {};
		if (this.wp_dirs.horizontal[nav_type]){
			start_point.top = target_dems.offset.top;
			if (this.wp_dirs.forward[nav_type]){
				//when moving to Right - start from left edge
				start_point.left = target_dems.offset.left;
			} else {
				//when moving to Left - start from right edge
				start_point.left = target_dems.offset.left + target_dems.width;
			}
		} else {
			start_point.left = target_dems.offset.left;
			if (this.wp_dirs.forward[nav_type]){
				//when moving to Bottom - start from top edge
				start_point.top = target_dems.offset.top;
			} else {
				//when moving to Top - start from bottom edge
				start_point.top = target_dems.offset.top + target_dems.height;
			}

		}
		var _this = this;
		corridor.sort(function(a, b) {
			return sortByRules(a, b, [
				function(el) {
					var cur_dems = dems_storage[el.wpid];
					var end_point = _this.getWPEndPoint(el, nav_type, dems_storage);
					
					var cathetus1 = Math.abs(end_point.top - start_point.top);
					var cathetus2 = Math.abs(end_point.left - start_point.left);
					var hypotenuse = Math.sqrt(Math.pow(cathetus1, 2) + Math.pow(cathetus2, 2));

					var path = _this.wp_dirs.horizontal[nav_type] ? cathetus2 : cathetus1;

					return (hypotenuse + path)/2;

				
				}
			]);
		});
	},
	getLenthBtwPoints: function(start_point, end_point) {
		var cathetus1 = Math.abs(end_point.top - start_point.top);
		var cathetus2 = Math.abs(end_point.left - start_point.left);
		var hypotenuse = Math.sqrt(Math.pow(cathetus1, 2) + Math.pow(cathetus2, 2));
		return hypotenuse;
	},
	matchWPForTriangles: function(dems_storage, nav_type, cur_wayp, target_wp, angle) {
		var curwp_dems = dems_storage[cur_wayp.wpid];
		var tagwp_dems = dems_storage[cur_wayp.wpid];

		var point_a = {},
			point_t = {},
			point_c = {},
			shift_length;

		point_t = this.getWPEndPoint(target_wp, nav_type, dems_storage);

		if (this.wp_dirs.horizontal[nav_type]){
			point_a.top = curwp_dems.offset.top + curwp_dems.height;
			shift_length = curwp_dems.height;
			

			point_c = {
				left: point_t.left,
				top: point_a.top
			};

			if (this.wp_dirs.forward[nav_type]){
				point_a.left  = curwp_dems.offset.left + curwp_dems.width;
				if (point_c.left < point_a.left){
					return false;
					//throw new Error('bad left position');
				}

			} else {
				point_a.left = curwp_dems.offset.left;
				if (point_c.left > point_a.left){
					return false;
					//throw new Error('bad left position');
				}
			}
		} else {
			point_a.left = curwp_dems.offset.left + curwp_dems.width;
			shift_length = curwp_dems.width;
			

			point_c = {
				left: point_a.left,
				top: point_t.top
			};

			if (this.wp_dirs.forward[nav_type]){
				point_a.top  = curwp_dems.offset.top + curwp_dems.height;
				if (point_c.top < point_a.top){
					return false;
					//throw new Error('bad top position');
				}

			} else {
				point_a.top = curwp_dems.offset.top;
				if (point_c.top > point_a.top){
					return false;
					//throw new Error('bad top position');
				}
			}
		}

		var a_length = this.getALength(cloneObj({},point_a), cloneObj({}, point_c), angle);

		var matched = this.matchTrianglesByPoints(point_a, point_c, nav_type, a_length, false, point_t);
		if (!matched){
			matched = this.matchTrianglesByPoints(point_a, point_c, nav_type, a_length, shift_length, point_t);
		}
		return matched;

	},
	matchTriaPoArray: function(arr) {
		for (var i = 0; i < arr.length ; i++) {

			if (arr[i] === 0){
				return true;
			} else {
				if (arr[i + 1] && (arr[i + 1] * arr[i] <= 0)){
					return false;
				}
			}
			
		}
		return true;
	},
	matchTrianglesByPoints: function(point_a, point_c, nav_type, a_length, shift_length, point_t) {
		var point_b = {};

		var dyn_field;
		var stat_field;
		if (this.wp_dirs.horizontal[nav_type]){
			stat_field = 'left';
			dyn_field = 'top';
		} else {
			stat_field = 'top';
			dyn_field = 'left';
			
		}

		point_b[stat_field] = point_c[stat_field];
		if (typeof shift_length == 'number'){
			point_c[dyn_field] -= shift_length;
			point_a[dyn_field] -= shift_length;
			point_b[dyn_field] = point_c[dyn_field] - a_length;
		} else {
			point_b[dyn_field] = point_c[dyn_field] + a_length;
		}

		var arr = this.triangleHasPoint(point_a, point_b, point_c, point_t);

		return this.matchTriaPoArray(arr);
	},
	triangleHasPoint: function(point_a, point_b, point_c, point_t) {
		var line1 = (point_a.left - point_t.left) * (point_b.top - point_a.top) - (point_b.left - point_a.left) * (point_a.top - point_t.top);
		var line2 = (point_b.left - point_t.left) * (point_c.top - point_b.top) - (point_c.left - point_b.left) * (point_b.top - point_t.top);
		var line3 = (point_c.left - point_t.left) * (point_a.top - point_c.top) - (point_a.left - point_c.left) * (point_c.top - point_t.top);
		return [line1, line2, line3];
		/*
		считаются произведения (1, 2, 3 - вершины треугольника, 0 - точка):
		(x1 - x0) * (y2 - y1) - (x2 - x1) * (y1 - y0)
		(x2 - x0) * (y3 - y2) - (x3 - x2) * (y2 - y0)
		(x3 - x0) * (y1 - y3) - (x1 - x3) * (y3 - y0)
		Если они одинакового знака, то точка внутри треугольника, если что-то из этого - ноль, то точка лежит на стороне, иначе точка вне треугольника.
		*/
	},
	getLastDot: function(point_a, point_t, angle_alpha) {
		var point_c;
		
		if (this.wp_dirs.horizontal[nav_type]){
			point_c = {
				left: point_t.left,
				top: point_a.top
			};
		} else {
			point_c = {
				left: point_a.left,
				top: point_t.top
			};
			
		}

		var a_length = this.getALength(point_a, point_c, angle_alpha);
		if (this.wp_dirs.horizontal[nav_type]){

		} else {

		}
		var point_b = {
			top: point_t.top,
			left: point_c.left + a_length
		};
	},
	getALength: function(point_a, point_c, angle_alpha) {
		//var b_point_arg = point_j.left + a_length;
		var sign;

		var toRad = function(angle){
			return angle * (Math.PI/180);
		};

		var angle_gamma = 90;
		var angle_beta = 180 - angle_gamma - angle_alpha;
		var a_length = (this.getLenthBtwPoints(point_a, point_c) * Math.sin(toRad(angle_alpha)) )/ Math.sin(toRad(angle_beta));

		return a_length;
	},
	getWPCorridor: function(cwp, nav_type, wayp_pack, dems_storage, angle) {
		var corridor = [];
		var target_dems = dems_storage[cwp.wpid];
		if (this.wp_dirs.horizontal[nav_type]){

			var cenp_top;
			var cenp_left;
			
			for (var i = 0; i < wayp_pack.length; i++) {
				var cur = wayp_pack[i];
				

				if (!cur){
					continue;
				}
				var pret_dems = dems_storage[cur.wpid];
				if (cur == cwp || cur.node == cwp.node){
					continue;
				}
				
				if (this.wp_dirs.forward[nav_type]){
					if (pret_dems.offset.left + pret_dems.width <= target_dems.offset.left + target_dems.width){
						//when move to Right - comparing Right edges
						continue;
					}
				} else {
					if (pret_dems.offset.left >= target_dems.offset.left){
						//when move to Left - comparing left edges
						continue;
					}
				}
				if (!angle){
					if ((pret_dems.offset.top + pret_dems.height) <= target_dems.offset.top){
						continue;
					}

					if (pret_dems.offset.top >= (target_dems.offset.top + target_dems.height)){
						continue;
					}
				} else {
					if (!this.matchWPForTriangles(dems_storage, nav_type, cwp, cur, angle)){
						continue;
					}
				}

				


				corridor.push(cur);
			}
		} else {
			for (var i = 0; i < wayp_pack.length; i++) {
				var cur = wayp_pack[i];
				if (!cur){
					continue;
				}
				var pret_dems = dems_storage[cur.wpid];
				if (cur == cwp || cur.node == cwp.node){
					continue;
				}
				
				if (this.wp_dirs.forward[nav_type]){
					if (pret_dems.offset.top + pret_dems.height <= target_dems.offset.top + target_dems.height){
						//when move to Bottom - comparing Bottom edges
						continue;
					}
				} else {
					if (pret_dems.offset.top >= target_dems.offset.top){
						//when move to Top - comparing Top edges
						continue;
					}
				}
				if (!angle){
					if ((pret_dems.offset.left + pret_dems.width ) <= target_dems.offset.left){
					continue;
					}
					if (pret_dems.offset.left >= (target_dems.offset.left + target_dems.width)){
						continue;
					}
				} else {
					if (!this.matchWPForTriangles(dems_storage, nav_type, cwp, cur, angle)){
						continue;
					}
				}
				corridor.push(cur);
			}
		}
		this.sortWPCorridor(target_dems, corridor, nav_type, dems_storage);
		
		return corridor;
	},
	wp_dirs: {
		all: {
			'Up': true,
			'Down': true,
			'Left': true,
			'Right': true
		},
		horizontal: {
			'Left': true,
			'Right': true
		},
		backward: {
			'Up': true,
			'Left': true
		},
		forward: {
			'Down': true,
			'Right': true
		}
	},
	checkCurrentWPoint: function(dems_storage) {
		if (this.cwp_check){
			clearTimeout(this.cwp_check);
			delete this.cwp_check;
		}
		

		var cwp = this.state('vis_current_wpoint');
		if (cwp && !this.getWPDemsForStorage(cwp, dems_storage)){
			//this.current_wpoint.node.removeClass('surf_nav');
			//delete this.current_wpoint;
			this.setVisState('current_wpoint', false);
		}

		return this.state('vis_current_wpoint');

	},
	scrollToWP: function(cwp) {
		if (cwp){
			var cur_md_md = this.state('current_mp_md');
			var parent_md = cur_md_md.getParentMapModel();
			if (parent_md && cwp.view.getAncestorByRooViCon('main') == parent_md.getRooConPresentation()){
				this.scrollTo(cwp.node, {
					node: this.getLevByNum(parent_md.map_level_num).scroll_con
				}, {vp_limit: 0.6, animate: 117});
			}
			this.scrollTo(cwp.node, false, {vp_limit: 0.6, animate: 117});
		}
	},
	'stch-vis_current_wpoint': function(nst, ost) {
		if (ost){
			ost.node.removeClass('surf_nav');
		}
		if (nst) {
			nst.node.addClass('surf_nav');
			//if (nst.view.getRooConPresentation() ==)
			
			this.scrollToWP(nst);
			
			//
		}
		
	},
	wayPointsNav: function(nav_type) {
		var _this = this;

		var cur_mp_md = this.state('current_mp_md');
		var roocon_view =  cur_mp_md && cur_mp_md.getRooConPresentation(true);
		if (roocon_view){
			var dems_storage = {};

			var cwp = this.state('vis_current_wpoint');
			if (nav_type == 'Enter'){
				if (cwp){
					cwp.node.click();
					var _this = this;

					this.cwp_check = setTimeout(function() {
						var still_in_use = _this.checkCurrentWPoint(dems_storage);
						if (still_in_use){
							_this.scrollToWP(still_in_use);
						}
					},100);
				}
				
			} else if (this.wp_dirs.all[nav_type]){
				cwp = this.checkCurrentWPoint(dems_storage);
				
				if (!cwp){
					var cur_view = roocon_view;
					var wayp_pack =[];

					while (!wayp_pack.length && cur_view){
						wayp_pack = this.getWPPack(cur_view, dems_storage);
						cur_view = cur_view.parent_view;
					}
					
					this.setVisState('current_wpoint', wayp_pack[0]);
					
				} else {
					var target_dems = cwp && dems_storage[cwp.wpid];
					if (!target_dems){
						throw new Error('there is no demensions!');
					}
					var corridor = this.getAnyPossibleWaypoints(cwp, nav_type, dems_storage);
					
					var new_wpoint = corridor[0];
					if (new_wpoint ){
						this.setVisState('current_wpoint', new_wpoint);
					}

				}
			}
			
		}
	},
	getAnyPossibleWaypoints: function(cwp, nav_type, dems_storage) {
		var corridor = [];
		var angle = 0;

		while (!corridor.length && angle < 90){
			var inner_corr = [];
			var cur_view = cwp.view;
			while (!inner_corr.length && cur_view){
				//getting parent views until find some usable waypoints;
				wayp_pack = this.getWPPack(cur_view, dems_storage);
				inner_corr = this.getWPCorridor(cwp, nav_type, wayp_pack, dems_storage, Math.min(angle, 89));
				cur_view = cur_view.parent_view;
			}
			corridor = inner_corr;
			angle += 5;

		}
		

		return corridor;
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
				callback(image)
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
	createUserAvatar: function(info, c, size){
		var _this = this;
		var imageplace = $("<div class='image-cropper'></div>").appendTo(c);
		$('<img alt="user photo" />').attr('src', info.photo).appendTo(imageplace);
		/*
		var image = this.preloadImage(info.photo, 'user photo', function(img){
			_this.verticalAlign(img, 50, true);
		}, imageplace); */
	},
	createLikeButton: function(lig){
		var nb = this.createNiceButton();
		nb.b.text( localize('want-meet', 'Want to meet') + '!');
		nb.enable();
		var pliking = false;
		nb.b.click(function(){
			if (!pliking){
				var p =
				su.s.api('relations.setLike', {to: lig.user}, function(r){
					
					if (r.done){
						su.trackEvent('people likes', 'liked');
						var gc = $("<div></div>");
						nb.c.after(gc);

						gc.append($('<span class="desc people-list-desc"></span>').text(localize('if-user-accept-i') + " " + localize('will-get-link')));
						nb.c.remove();
					}
					pliking = false;
				});
				pliking = true;
			}
			
			
			
		});
		return nb;
	},
	createAcceptInviteButton: function(lig){
		var nb = this.createNiceButton();
		nb.b.text( localize('accept-inv', 'Accept invite'));
		nb.enable();
		var pliking = false;
		nb.b.click(function(){
			if (!pliking){
				var p =
				su.s.api('relations.acceptInvite', {from: lig.user}, function(r){
					
					if (r.done){
						su.trackEvent('people likes', 'accepted', false, 5);
						nb.c.after(
							$('<span class="people-list-desc desc"></span>')
								.text(su.getRemainTimeText(r.done.est, true))
						);
						nb.c.remove();
					}
					pliking = false;
				});
				pliking = true;
			}
			
			
			
		});
		return nb;
	},
	
	getAcceptedDesc: function(rel){
		var link = rel.info.domain && ('http://vk.com/' + rel.info.domain);
		if (link && rel.info.full_name){
			return $('<a class="external"></a>').attr('href', link).text(rel.info.full_name);
		}  else if (rel.item.est){
			return $("<span class='desc'></span>").text(su.getRemainTimeText(rel.item.est, true));
		}
	},
	showBigListener: function(c, lig){
		
		var _this = this;
		
		c.empty();
		
		if (lig.info && lig.info.photo_big){
			var algd;
			var doAlign = function(){

			};
			var img = _this.preloadImage(lig.info.photo_big, 'user photo', function(img){
				if (!algd){
					algd = true;
					_this.verticalAlign(img, {
						target_height: 252,
						animate: true,
						animate_time: 66
					});
				}
					
			}, $('<div class="big-user-avatar"></div>').appendTo(c));

			var real_height = (img.naturalHeight ||  img.height);
			if (real_height){
				algd = true;
				this.verticalAlign(img, {
					real_height: real_height,
					target_height: 252
				});

			}

		}
		
		if (su.s.loggedIn()){
			var liked = su.s.susd.isUserLiked(lig.user);
			var user_invites_me = su.s.susd.didUserInviteMe(lig.user);
			
			if (liked){
				
				
				if (liked.item.accepted){
					c.append(this.getAcceptedDesc(liked));
				} else{
					
					c.append(localize('you-want-user'));
					
					c.append('<br/>');
					
					c.append($('<span class="desc people-list-desc"></span>').text(localize('if-user-accept-i') + " " + localize('will-get-link')));
				}
				
				
			} else if (user_invites_me){
				if ( user_invites_me.item.accepted){
					c.append(this.getAcceptedDesc(user_invites_me));
				} else{
					c.append(localize('user-want-you'));
					c.append('<br/>');
					var lb = this.createAcceptInviteButton(lig);
					lb.c.appendTo(c);
				}
				
			} else {
				var current_user_info = su.s.getInfo('vk');

				if (current_user_info && current_user_info.photo_big) {
					this.createLikeButton(lig).c.appendTo(c);
				} else {
					var photoupreq_c = this.createPhotoUploadRequest();
					c.append(photoupreq_c);

					this.on('vip-state-change.vk_info.song-listener', function(e) {
						if (e.value && e.value.photo_big){
							photoupreq_c.before(this.createLikeButton(lig).c);

							photoupreq_c.remove();
						}
					}, {
						exlusive: true,
						immediately: true
					});
				}
			}
			
		} else{
			c.append(this.samples.vk_login.clone(localize('to-meet-man-vk')));
			
		}
		
		
	},
	createPhotoUploadRequest: function() {
		var con = $('<div></div>');

		var vk_photo_meet_need = localize('vk_photo_meet_need');
		var vk_photo_update = localize('vk_photo_update');

		var nb = this.createNiceButton();
		nb.b.text( vk_photo_update );
		nb.enable();
		nb.c.addClass('get-vk-photo-request-b');
		var _this = this;
		nb.b.click(function(){
			_this.md.getPhotoFromVK();
		});
		con.append(nb.c);

		
		var big_string = vk_photo_meet_need.replace('%button_name%', vk_photo_update);
		var desc = document.createTextNode(big_string);
		con.append(desc);
		return con;

	},
	getRtPP: function(node){
		throw new Error('cant detect position');
		var clicked_node = $(node);
		
		var target_offset = clicked_node.offset();
		var container_offset = this.els.pllistlevel.offset();
		return {
			left: target_offset.left - container_offset.left,
			top: target_offset.top - container_offset.top,
			cwidth: this.els.pllistlevel.width()
		};
	},
	createSongListener: function(lig, uc){
		var _this = this;
		
		var li = $('<li class="song-listener"></li>').click(function() {
			
			if (!uc.isActive('user_info') || uc.D('user_info', 'current-user') != lig.user){
				
				
				
				uc.D('user_info', 'current-user', lig.user);

				
				var c = uc.C('user_info');

				_this.showBigListener(c, lig);
				su.s.auth.regCallback('biglistener', function(){
					_this.showBigListener(c, lig);
				});
				
				//var p = _this.getRtPP(li[0]);

				//var li_pos = ;
				// 5 /*(p.left + $(li[0]).outerWidth()/2) -13 */

				uc.showPart('user_info', function() {
					return {
						left: li.offset().left,
						owidth: li.outerWidth()
					};
				});
				su.trackEvent('peoples', 'view');
			} else{
				uc.hide();
			}

		});
		this.createUserAvatar(lig.info, li);
		
		
		return li;
				
				
	},
	createSongListeners: function(listenings, place, above_limit_value, exlude_user, users_context){
		var _this = this;
		var users_limit = 3;
		for (var i=0, l = Math.min(listenings.length, Math.max(users_limit, users_limit + above_limit_value)); i < l; i++) {
			if (!exlude_user || (listenings[i].user != exlude_user && listenings[i].info)){
				place.append(this.createSongListener(listenings[i], users_context));
			}
		}
		return Math.max(users_limit - listenings.length, 0);
	},
	create_youtube_video: function(id, transparent){
		var youtube_video = document.createElement('embed');
		if (su.env.opera_widget){
			youtube_video.setAttribute('wmode',"transparent");
		} else if (su.env.opera_extension){
			youtube_video.setAttribute('wmode',"opaque");
		}
		
		
			youtube_video.setAttribute('type',"application/x-shockwave-flash");
			youtube_video.setAttribute('src', 'https://www.youtube.com/v/' + id + '&autoplay=1');
			youtube_video.setAttribute('allowfullscreen',"true");
			youtube_video.setAttribute('class',"you-tube-video");
			
		return youtube_video;
	},
	bindLfmTextClicks: function(con) {

		con.on('click', '.bbcode_artist', function(e) {
			e.preventDefault();

			var artist_name = decodeURIComponent($(this).attr('href').replace('http://www.last.fm/music/','').replace(/\+/g, ' '));
			su.showArtcardPage(artist_name);
			seesu.trackEvent('Artist navigation', 'bbcode_artist', artist_name);

		});

		con.on('click', '.bbcode_tag', function(e) {
			e.preventDefault();

			var tag_name = decodeURIComponent($(this).attr('href').replace('http://www.last.fm/tag/','').replace(/\+/g, ' '));
			su.show_tag(tag_name);
			seesu.trackEvent('Artist navigation', 'bbcode_tag', tag_name);
		});


	
	},
	loadImage: function(opts) {
		
		if (opts.url){
			var queue;
			if (opts.url.indexOf('last.fm') != -1){
				queue = this.lfm_imgq;
			} else if (opts.url.indexOf('discogs.com') != -1) {
				queue = this.dgs_imgq;
			}
			opts.timeout = opts.timeout || 40000;
			opts.queue = opts.queue || queue;
			return loadImage(opts);
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