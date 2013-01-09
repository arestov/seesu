var appModelView = function(){};
provoda.View.extendTo(appModelView, {

	createDetailes: function(){
		this.root_view = this;
		this.d = this.opts.d;

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
		//	su.removeDOM(d, this);
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
			if (!view){
				throw new Error('give me "view"');
			}
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
		playlist: {
			main: songsListView,
			details: songsListView,
			nav: baseNavUI
		},
		usercard: {
			nav: baseNavUI,
			main: UserCardView
		},
		song: {
			nav: baseNavUI
		}
	},
	'collch-usercard': function(name, arr) {
		var _this = this;
		$.each(arr, function(i, el){
			var view = _this.getFreeChildView(name, el, 'main');
			if (view){

				var lev_conj = _this.getLevelContainer(el.map_level_num, view);
				if (lev_conj){
					view.wayp_scan_stop = true;
					lev_conj.material.append(view.getA());
				}
				
			}

		});

		this.requestAll();
	},
	'collch-navigation': function(name, arr) {
		var _this = this;
		$.each(arr, function(i, el){
			var md_name = el.model_name;
			var view = _this.getFreeChildView(md_name, el, 'nav');
			if (view){
				_this.nav.daddy.append(view.getA());
			}

		});

		this.requestAll();

	},
	'collch-invstg': function(name, arr) {
		var _this = this;
		$.each(arr, function(i, el){
			var view = _this.getFreeChildView(name, el, 'main');
			if (view){

				var lev_conj = _this.getLevelContainer(el.map_level_num, view);
				if (lev_conj){
					view.wayp_scan_stop = true;
					lev_conj.material.append(view.getA());
				}
				
			}

		});

		this.requestAll();
	},
	'collch-artcard':  function(name, arr) {
		var _this = this;
		$.each(arr, function(i, el){
			var view = _this.getFreeChildView(name, el, 'main');
			if (view){
				var lev_conj = _this.getLevelContainer(el.map_level_num, view);
				if (lev_conj){
					view.wayp_scan_stop = true;
					lev_conj.material.append(view.getA());
				}
			}


		});

		this.requestAll();
		/*

		'collch-playlist': function(name, arr) {
			var _this = this;
			$.each(arr, function(i, el){
				var view = _this.getFreeChildView(name, el, 'main', {overview: true});
				if (view){
					_this.getLevelContainer(el.map_level_num, view).append(view.getA());
				}
				var det_view = _this.getFreeChildView(name, el, 'details');
				if (det_view){
					_this.getLevelContainer(el.map_level_num + 1, view).append(det_view.getA());
				}

			});

			this.requestAll();
		},

		*/
	},
	'collch-playlist': function(name, arr) {
		var _this = this;
		$.each(arr, function(i, el){
			var view = _this.getFreeChildView(name, el, 'main', {overview: true});
			if (view){
				var lev_conj = _this.getLevelContainer(el.map_level_num, view);
				if (lev_conj){
					view.wayp_scan_stop = true;
					lev_conj.material.append(view.getA());
				}
			}
			var det_view = _this.getFreeChildView(name, el, 'details');
			if (det_view){
				var lev_conj = _this.getLevelContainer(el.map_level_num + 1, det_view);
				if (lev_conj){
					det_view.wayp_scan_stop = true;
					lev_conj.material.append(det_view.getA());
				}
			}

		});

		this.requestAll();
	},
	'collch-start_page': function(name, md) {
		var view = this.getFreeChildView(name, md, 'main');
		if (view){
			var _this = this;

			var checkFocus = function(opts) {
				if (opts){
					if (opts.userwant && !(opts.url_restoring || opts.transit)){
						_this.search_input[0].focus();
						_this.search_input[0].select();
					} else {
						_this.search_input[0].blur();
					}
					
				}
			};
			checkFocus(view.state('mp-show-end'));

			view.on('state-change.mp-show-end', function(e) {
				checkFocus(e.value);
			});
		}
		this.requestAll();
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
			depends_on: ['current-mp-md'],
			fn: function(md) {
				if (!md || md.map_level_num == -1){
					return true;
				}
			}
		}
	},
	'stch-start-level': function(state) {
		//this.els.start_screen.toggleClass('inactive-page', !state);
	},
	//
	'stch-current-mp-md': function(md, old_md) {

		//map_level_num
		//md.map_level_num
		var oved_now_active = old_md && (old_md.map_level_num-1 ===  md.map_level_num);
		if (old_md){
			this.hideLevNum(old_md.map_level_num);
			if (!oved_now_active){
				this.removePageOverviewMark(old_md.map_level_num-1);
			}
			
		}
		
		this.addPageOverviewMark(md.map_level_num - 1);
		this.showLevNum(md.map_level_num);
		if (oved_now_active){
			this.removePageOverviewMark(old_md.map_level_num-1);
		}
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
		}

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

			
		}

		//var parent_md = md.getParentMapModel();
		//this.getChildView()
	},
	'stch-map-animation': function(changes) {
		if (!changes){
			return;
		}
		var all_changhes = $filter(changes.array, 'changes');
		all_changhes = [].concat.apply([], all_changhes);
		
		for (var i = 0; i < all_changhes.length; i++) {
			var cur = all_changhes[i];

			if (cur.type == 'move-view'){
				cur.target.updateState('vis-mp-show', {
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
	'stch-show-search-form': function(state) {
		this.els.search_form.toggleClass('hidden', !state);
	},
	"animation-type":{
		"mp-has-focus": function(target, state) {

		},
		"mp-show": function(target, state) {

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
		"flash-internet":function(state){
			this.toggleBodyClass(state, 'flash-internet');
		},
		"viewing-playing": function(state) {
			if (this.now_playing_link){
				if (state){
					this.now_playing_link.removeClass("nav-button");
				} else {
					this.now_playing_link.addClass("nav-button");
				}
			}
		},
		"search-query": function(state) {
			this.search_input.val(state || '');
		},
		'now-playing': function(text) {

			var md = this.md;
			var _this = this;
			if (!this.now_playing_link && this.nav){
				this.now_playing_link = $('<a class="nav-item np-button"><span class="np"></span></a>').click(function(){
					md.show_now_playing(true);
				}).appendTo(this.nav.justhead);

				this.addWayPoint(this.now_playing_link, function() {
					return !_this.state('viewing-playing');
				});
			}
			if (this.now_playing_link){
				this.now_playing_link.attr('title', (localize('now-playing','Now Playing') + ': ' + text));
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
		"doc-title": function(title) {
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
	buildAppDOM: function() {
		var _this = this;
		var d = this.d;
		domReady(this.d, function() {
			console.log('dom ready');
			

			

			var slider = d.getElementById('slider');
			var screens_block = $('#screens',d);

			if (app_env.readySteadyResize){
				app_env.readySteadyResize(screens_block[0]);
			}
			

			
			var ui_samples = $('#ui-samples',d);

			
			var search_form = $('#search',d);
			

			var start_screen = $('#start-screen',d);

			
			var shared_parts_c = screens_block.children('.shared-parts');

			_this.els = {
				screens: screens_block,
				scrolling_viewport: app_env.as_application ? {
					node: screens_block
				} : {
					node: $(d.body),
					offset: true
				},
				slider: slider,
				navs: $(slider).children('.navs'),
				start_screen: start_screen,
				search_input: $('#q',d),
				search_form: search_form,
				fast_personal_start: start_screen.children('.fast-personal-start'),
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
				_this.overrideStateSilently('search-query', input_value);
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
			

			if ($.browser.opera && ((typeof window.opera.version == 'function') && (parseFloat(window.opera.version()) <= 10.1))){
				
				$('<a id="close-widget">&times;</a>',d)
					.click(function(){
						window.close();
					})
					.prependTo(_this.els.slider);
			}
			
			

			var vklc = ui_samples.children('.vk-login-context');

			var track_c = ui_samples.children('.track-context');
			_this.samples = {
				artcard: ui_samples.children('.art_card'),
				track_c : track_c,
				playlist_panel: ui_samples.children('.play-list-panel'),
				vklc: vklc,
				lfm_authsampl: ui_samples.children('.lfm-auth-module'),
				lfm_input: ui_samples.children('.lfm-manual-user'),
				lfm_scrobling: ui_samples.children('.scrobbling-switches'),
				vk_login: {
					o: vklc,
					oos: $(),
					hideLoadIndicator: function(){
						this.oos.removeClass('waiting-vk-login');
						this.load_indicator = false;
					},
					showLoadIndicator:function() {
						this.oos.addClass('waiting-vk-login');
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
							nvk.addClass('waiting-vk-login');
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
						var input = this.nvk.find('.vk-code');
						nvk.find('.use-vk-code').click(function() {
							var vk_t_raw = input.val();
							if (vk_t_raw){
								var vk_token = new vkTokenAuth(su.vkappid, vk_t_raw);
								connectApiToSeesu(vk_token, true);
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

			justhead.children('.daddy').empty().removeClass('not-inited');
			

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
	canUseWaypoint: function(cur_wayp ) {
		var cur = cur_wayp.node;

		if (cur_wayp.canUse && !cur_wayp.canUse()){
			return;
		}
		if (cur.css('display') == 'none'){
			return;
		}

		var height = cur.height();
		if (!height){
			return;
		}
		var width = cur.width();
		if (!width){
			return;
		}
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
				break
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
			offset: offset,
		};
	},
	getWPPack: function(view) {
		var all_waypoints = view.getAllWaypoints();
		var wayp_pack = [];

		for (var i = 0; i < all_waypoints.length; i++) {
			var cur_wayp = all_waypoints[i];
			var cur = cur_wayp.node;
			var dems = this.canUseWaypoint(cur_wayp);
			if (!dems){
				cur.data('dems', null);
				cloneObj(cur_wayp, {
					height: null,
					width: null,
					offset: null,
				});
				continue;
			} else {
				cloneObj(cur_wayp, dems);
			}
			cur.data('dems', cur_wayp)
			wayp_pack.push(cur_wayp);

			
		}
		return wayp_pack;
	},
	getWPCorridor: function(cur_dems, wayp_pack, nav_type) {
		var corridor = [];
		if (this.wp_dirs.horizontal[nav_type]){
			
			for (var i = 0; i < wayp_pack.length; i++) {
				var cur = wayp_pack[i];
				if (cur == cur_dems || cur.node == cur_dems.node){
					continue;
				}
				if ((cur.offset.top + cur.height) <= cur_dems.offset.top){
					continue;
				}

				if (cur.offset.top >= (cur_dems.offset.top + cur_dems.height)){
					continue;
				}
				if (this.wp_dirs.forward[nav_type]){
					if (cur.offset.left <= cur_dems.offset.left){
						continue;
					}
				} else {
					if (cur.offset.left >= (cur_dems.offset.left + cur_dems.width)){
						continue;
					}
				}
				corridor.push(cur);
			}
		} else {
			for (var i = 0; i < wayp_pack.length; i++) {
				var cur = wayp_pack[i];
				if (cur == cur_dems || cur.node == cur_dems.node){
					continue;
				}
				if ((cur.offset.left + cur.width ) <= cur_dems.offset.left){
					continue;
				}
				if (cur.offset.left >= (cur_dems.offset.left + cur_dems.width)){
					continue;
				}
				if (this.wp_dirs.forward[nav_type]){
					if (cur.offset.top <= cur_dems.offset.top){
						continue;
					}
				} else {
					if (cur.offset.top >= (cur_dems.offset.top + cur_dems.height)){
						continue;
					}
				}
				
				corridor.push(cur);
			}
		};

		var start_point = {};
		if (this.wp_dirs.horizontal[nav_type]){
			start_point.top = cur_dems.offset.top;
			if (this.wp_dirs.forward[nav_type]){
				start_point.left = cur_dems.offset.left + cur_dems.width;
			} else {
				start_point.left = cur_dems.offset.left;
			}
		} else {
			start_point.left = cur_dems.offset.left;
			if (this.wp_dirs.forward[nav_type]){
				start_point.top = cur_dems.offset.top + cur_dems.height;
			} else {
				start_point.top = cur_dems.offset.top;
			}

		}
		var _this = this;
		corridor.sort(function(a, b) {
			return sortByRules(a, b, [
				function(el) {
					
					var end_point = {};
					
					if (_this.wp_dirs.horizontal[nav_type]){
						end_point.top = el.offset.top;
						if (_this.wp_dirs.forward[nav_type]){
							end_point.left = el.offset.left;
						} else {
							end_point.left = el.offset.left + el.width;
						}
					} else {
						end_point.left = el.offset.left;
						if (_this.wp_dirs.forward[nav_type]){
							end_point.top = el.offset.top;
						} else {
							end_point.top = el.offset.top + el.height;
						}
					}
					var cathetus1 = Math.abs(end_point.top - start_point.top);
					var cathetus2 = Math.abs(end_point.left - start_point.left);
					var hypotenuse = Math.sqrt(Math.pow(cathetus1, 2) + Math.pow(cathetus2, 2));

					var path = _this.wp_dirs.horizontal[nav_type] ? cathetus2 : cathetus1;

					return (hypotenuse + path)/2;

				
				}
			]);
		});
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
	checkCurrentWPoint: function() {
		if (this.cwp_check){
			clearTimeout(this.cwp_check);
			delete this.cwp_check;
		}
		

		var cwp = this.state('vis-current_wpoint');
		if (cwp && !this.canUseWaypoint(cwp)){
			//this.current_wpoint.node.removeClass('surface_navigation');
			//delete this.current_wpoint;
			this.setVisState('current_wpoint', false);
		}

	},
	'stch-vis-current_wpoint': function(nst, ost) {
		if (ost){
			ost.node.removeClass('surface_navigation');
		}
		if (nst) {
			nst.node.addClass('surface_navigation');
			//if (nst.view.getRooConPresentation() ==)
			 
			var cur_md_md = this.state('current-mp-md');
			var parent_md = cur_md_md.getParentMapModel();
			if (parent_md && nst.view.getAncestorByRooViCon('main') == parent_md.getRooConPresentation()){
				this.scrollTo(nst.node, {
					node: this.getLevByNum(parent_md.map_level_num).scroll_con
				}, {vp_limit: 0.6, animate: 117});
			} else {
				this.scrollTo(nst.node, false, {vp_limit: 0.6, animate: 117});
			}
			//
		}
		
	},
	wayPointsNav: function(nav_type) {
		
		var cur_mp_md = this.state('current-mp-md');
		var roocon_view =  cur_mp_md && cur_mp_md.getRooConPresentation(true);
		if (roocon_view){
			var cwp = this.state('vis-current_wpoint');
			if (nav_type == 'Enter'){
				if (cwp){
					cwp.node.click();
					var _this = this;

					this.cwp_check = setTimeout(function() {
						_this.checkCurrentWPoint();
					},100);
				}
				
			} else if (this.wp_dirs.all[nav_type]){
				this.checkCurrentWPoint();
				
				var cur_dems = cwp && cwp.node.data('dems');
				if (!cwp){
					wayp_pack = this.getWPPack(roocon_view);
					this.setVisState('current_wpoint', wayp_pack[0]);
					
				} else {
				
					
					
					

					if (!cur_dems){
						throw new Error('there is no demensions!')
					}
					var corridor = [];
					var cur_view = cur_dems.view;
					while (!corridor.length && cur_view){
						wayp_pack = this.getWPPack(cur_view);
						corridor = this.getWPCorridor(cwp.node.data('dems'), wayp_pack, nav_type);
						cur_view = cur_view.parent_view;
					}
					var new_wpoint = corridor[0];
					if (new_wpoint ){
						this.setVisState('current_wpoint', new_wpoint)
					}

				}
			}
			
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
					$(img).animate({'margin-top':  offset + 'px'}, 200);
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
					callback(image)
				}
			}, 10)
			
		}
		return image;
	},
	createUserAvatar: function(info, c, size){
		var _this = this;
		var imageplace = $("<div class='image-cropper'></div>").appendTo(c)
		$('<img alt="user photo" width="50" height="50"/>').attr('src', info.photo).appendTo(imageplace);
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
				})
				pliking = true
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
				})
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
						animate: true
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
				var lb = this.createLikeButton(lig);
				lb.c.appendTo(c);
			}
			
		} else{
			c.append(this.samples.vk_login.clone(localize('to-meet-man-vk')));
			
		}
		
		
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
			
			if (!uc.isActive('user-info') || uc.D('user-info', 'current-user') != lig.user){
				
				
				
				uc.D('user-info', 'current-user', lig.user);

				
				var c = uc.C('user-info');

				_this.showBigListener(c, lig);
				su.s.auth.regCallback('biglistener', function(){
					_this.showBigListener(c, lig);
				});
				
				//var p = _this.getRtPP(li[0]);

				//var li_pos = ;
				// 5 /*(p.left + $(li[0]).outerWidth()/2) -13 */

				uc.showPart('user-info', function() {
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
		};
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
			youtube_video.setAttribute('src', 'https://www.youtube.com/v/' + id);
			youtube_video.setAttribute('allowfullscreen',"true");
			youtube_video.setAttribute('class',"you-tube-video");
			
		return youtube_video;		
	},
	
	
	renderArtistAlbums: function(albums, original_artist, albums_ul, vopts){
		if (albums.length) {
			for (var i=0; i < albums.length; i++) {
				albums_ul.append(this.createAlbum(albums[i].name, albums[i].url, (albums[i].image && albums[i].image[2]['#text']) || '', albums[i].artist.name, original_artist, vopts));
			}
		} 
		return albums_ul;
	},
	createAlbum: function(al_name, al_url, al_image, al_artist, original_artist, vopts){
		var _this = this;
		var li = $('<li></li>');
			var a_href= $('<a></a>')
				.attr('href', al_url )
				.click(function(e){
					e.preventDefault(); 
					_this.md.showAlbum({
						artist: al_artist, 
						album_name: al_name,
						original_artist: original_artist
					}, vopts);
					seesu.trackEvent('Artist navigation', 'album', al_artist + ": " + al_name);
				})
				.appendTo(li);
			$('<img/>').attr('src', al_image).appendTo(a_href);
			$('<span class="album-name"></span>').text(al_name).appendTo(a_href);
			
		return li;
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
	createNiceButton: function(position){
		var c = $('<span class="button-hole"><a class="nicebutton"></a></span>');
		var b = c.children('a');
		
		if (position == 'left'){
			c.addClass('bposition-l')
		} else if (position == 'right'){
			c.addClass('bposition-r')
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
		}
		bb.disable();
		return bb;
	}
});