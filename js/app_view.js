var appModelView = function(){};
provoda.View.extendTo(appModelView, {

	createDetailes: function(){
	//	this.sui = su.ui;
		this.d = this.opts.d;

		var _this = this;
		setTimeout(function() {
			_this.buildSOM();
		});
		
		if (this.opts.can_die && getDefaultView(d)){
			this.can_die = true;
			this.checkLiveState = function() {
				if (!getDefaultView(d)){
					_this.reportDomDeath();
					return true;
				}
			};

			this.lst_interval = setInterval(this.checkLiveState, 1000);
			
		}

	},
	reportDomDeath: function() {
		if (this.can_die && !this.dom_dead){
			this.dom_dead = true;
			clearInterval(this.lst_interval);
		//	var d = this.d;
		//	delete this.d;
		//	su.removeDOM(d, this);
			
			console.log('DOM dead! ' + this.nums);
			
		}
	},
	children_views: {
		"start_page" : {
			main: mainLevelUI,
			nav: mainLevelNavUI
		}
	},

	manual_states_connect: true,
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
		'now-playing': function(text) {

			var md = this.md;
			
			if (!this.now_playing_link && this.nav){
				this.now_playing_link = $('<a class="nav-item np-button"><span class="np"></span></a>').click(function(){
					md.show_now_playing(true);
				}).appendTo(this.nav.justhead);
			}
			if (this.now_playing_link){
				this.now_playing_link.attr('title', (localize('now-playing','Now Playing') + ': ' + text));	
			}	
		},
		playing: function(state) {
			var s = this.els.pllistlevel.add(this.now_playing_link);
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
			this.d.title = 	title || "";
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
	buildSOM: function() {
		var _this = this;
		var d = this.d;
		domReady(this.d, function() {
			console.log('dom ready');
			

			

			var slider = d.getElementById('slider');
			if (app_env.readySteadyResize){
				app_env.readySteadyResize(slider);
			}
			

			
			var ui_samples = $('#ui-samples',d);

			var pllistlevel = $('#playlist-level',d);
			
			var search_form = $('#search',d); 
			

			var start_screen = $('#start-screen',d);
			_this.els = {
				scrolling_viewport: app_env.as_application ? {node:$('#screens',d)} : {node: $(d.body), offset: true},
				slider: slider,
				navs: $(slider).children('.navs'),
				start_screen: start_screen,
				artcards: $('#art-cards', d),
				pllistlevel: pllistlevel,
				artsTracks: pllistlevel.find('#tracks-magic'),
				searchres: $('#search_result',d),
				search_input: $('#q',d),
				search_form: search_form,
				fast_personal_start: start_screen.children('.fast-personal-start'),
				start_page_place: start_screen.children('.for-startpage')
			};
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
			});
			
			
			$('#widget-url',d).val(location.href.replace('index.html', ''));
			var seesu_me_link = $('#seesu-me-link',d);
			seesu_me_link.attr('href', seesu_me_link.attr('href').replace('seesu%2Bapplication', su.env.app_type));


			if ($.browser.opera && ((typeof window.opera.version == 'function') && (parseFloat(window.opera.version()) <= 10.1))){
				
				$('<a id="close-widget">&times;</a>',d)
					.click(function(){
						window.close();
					})
					.prependTo(sui.els.slider);
			}
			
			

			var vklc = ui_samples.children('.vk-login-context');

			var track_c = ui_samples.children('.track-context');
			_this.samples = {
				artcard: ui_samples.children('.art-card'),
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
			

			
			jsLoadComplete(function(){
				$(d).click(function(e) {
					return test_pressed_node(e);
				});
			});
			
			_this.onDomBuild();
		});
	},
	onDomBuild: function() {
		this.c = $(this.d.body);
		this.c.addClass('app-loaded');
		this.connectStates();

		var start_page_view = this.getFreeChildView('start_page', this.md.start_page, 'main');
		
		this.addChild(start_page_view);

		this.requestAll();
		
		
		var ext_search_query = this.els.search_input.val();

		this.md.checkUserInput({
			ext_search_query: ext_search_query
		});
		
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
			
	}
});