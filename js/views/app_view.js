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
			return this.lev_containers[num] = $('<div class="complex-page inactive-page"></div>').addClass('index-of-cp-is-' + num).appendTo(this.els.screens)
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
			nav: artCardNavUI
		},
		playlist: {
			main: songsListView,
			details: songsListView,
			nav: playlistNavUI
		},
		song: {
			nav: trackNavUI
		}
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

				_this.getLevelContainer(el.map_level_num, view).append(view.getA());
			}

		});

		this.requestAll();
	},
	'collch-artcard':  function(name, arr) {
		var _this = this;
		$.each(arr, function(i, el){
			var view = _this.getFreeChildView(name, el, 'main');
			if (view){
				_this.getLevelContainer(el.map_level_num, view).append(view.getA());
			}


		});

		this.requestAll();
	},
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
	'collch-start_page': function(name, md) {
		var view = this.getFreeChildView(name, md, 'main');
		if (view){
			var _this = this;

			var checkFocus = function(opts) {
				if (opts && opts.userwant){
					_this.search_input[0].focus();
					_this.search_input[0].select();
				}
			};
			checkFocus(view.state('mp-show-end'));

			view.on('state-change.mp-show-end', function(e) {
				checkFocus(e.value)
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
			if (num == -1){
				return this.els.start_screen
			} else {
				return this.getLevelContainer(num);
			}
		}
		
	},
	hideLevNum: function(num) {

		var levc = this.getLevByNum(num, true);
		if (levc){
			levc.addClass('inactive-page');
		}
		
	},
	showLevNum: function(num) {
		var levc = this.getLevByNum(num, true);
		if (levc){
			levc.removeClass('inactive-page');
		}
		
	},
	removePageOverviewMark: function(num) {
		var levc = this.getLevByNum(num);
		if (levc){
			levc.removeClass('page-overview');
		}
	},
	addPageOverviewMark: function(num) {
		var levc = this.getLevByNum(num);
		if (levc){
			levc.addClass('page-overview');
		}
	},
	complex_states: {
		'start-level': {
			depends_on: ['active-lev-num'],
			fn: function(nwrap) {
				if (!nwrap || nwrap.n == -1){
					return true;
				}
			}
		}
	},
	'stch-start-level': function(state) {
		this.els.start_screen.toggleClass('inactive-page', !state);
	},
	//
	'stch-active-lev-num': function(num, old_num) {

		var oved_now_active = old_num && (old_num.n-1 ===  num.n);
		if (old_num){
			this.hideLevNum(old_num.n);
			if (!oved_now_active){
				this.removePageOverviewMark(old_num.n-1);
			}
			
		}
		
		this.addPageOverviewMark(num.n - 1);
		this.showLevNum(num.n);
		if (oved_now_active){
			this.removePageOverviewMark(old_num.n-1);
		}
	},
	'stch-map-animation': function(changes) {
		if (!changes){
			return
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
			}
			
		}
		console.log(all_changhes)
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
			this.d.title = 	title || "";
		}
	},
	getScrollVP: function() {
		return this.els.scrolling_viewport;
	},
	scrollTo: function(view) {
		if (!view){return false;}
	//	if (!this.view_port || !this.view_port.node){return false;}

		//var scrollingv_port = ;

		//var element = view.getC();

		var jnode = $(view.getC());
		if (!jnode[0]){
			return
		}



		var svp = this.getScrollVP(),
			scroll_c = svp.offset ? $((svp.node[0] && svp.node[0].ownerDocument) || svp.node[0]) :   svp.node,
			scroll_top = scroll_c.scrollTop(), //top
			scrolling_viewport_height = svp.node.height(), //height
			scroll_bottom = scroll_top + scrolling_viewport_height; //bottom
		
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
		if ( el_bottom > scroll_bottom || el_bottom < scroll_top){
			new_position =  el_bottom - scrolling_viewport_height/2;
		}
		if (new_position){
			scroll_c.scrollTop(new_position);
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
			if (app_env.readySteadyResize){
				app_env.readySteadyResize(slider);
			}
			

			
			var ui_samples = $('#ui-samples',d);

			
			var search_form = $('#search',d); 
			

			var start_screen = $('#start-screen',d);

			var screens_block = $('#screens',d);
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
				start_page_place: start_screen.children('.for-startpage')
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
		if((_key == '40') || (_key == '63233')){
			e.preventDefault();
			key_name = 'Up';
		} else 
		if((_key == '38') || (_key == '63232')){
			e.preventDefault();
			key_name = 'Down';
		}
		if (key_name){
			this.md.keyNav(key_name);
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
				pliking = true
			}
			
			
			
		});
		return nb;
	},
	
	getAcceptedDesc: function(rel){
		var link = rel.info.domain && ('http://vk.com/' + rel.info.domain);
		if (link && rel.info.full_name){
			return $('<a class="external"></a>').attr('href', link).text(rel.info.full_name);
		}  else if (rel.item.est){
			return $("<span class='desc'></span>").text(this.getRemainTimeText(rel.item.est, true));
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