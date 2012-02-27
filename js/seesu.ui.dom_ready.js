window.connect_dom_to_som = function(d, sui, cb){
	if (window.resizeWindow && d){
		var dw = getDefaultView(d);
		if (dw && dw.window_resized){
			resizeWindow(dw);
		}
		
	}

	

	domReady(d, function() {
		console.log('dom ready')
		d.head = d.head || d.getElementsByTagName('head')[0];

		if (su.env.check_resize){
			dstates.add_state('body', 'slice-for-height');
		}
		if (su.env.deep_sanbdox){
			dstates.add_state('body', 'deep-sandbox');
		}
		dstates.connect_ui(sui);

		var lang = app_env.lang;
		$('.lang', d).each(function(i,el){
			var cn = el.className;
			var classes = cn.split(/\s/);
			$.each(classes, function(z, cl){
				if (cl.match(/localize/)){
					var term = localizer[cl.replace('localize-','')];
					if (term && term[lang]){
						$(el).text(term[lang]);
					}
				}
			});
			
		});

		var slider = d.getElementById('slider');
		if (su.env.readySteadyResize){
			su.env.readySteadyResize(slider);
		}
		
		var volume_s = d.createElement('style');
			volume_s.setAttribute('title', 'volume');
			volume_s.setAttribute('type', 'text/css');
		var volume_style= '.volume-state-position {width:' + ((su.p.volume * 50)/100) + 'px' + '}'; 
		if (volume_s.styleSheet){
			volume_s.styleSheet.cssText = volume_style;
		} else{
			volume_s.appendChild(d.createTextNode(volume_style));
		}
		d.documentElement.firstChild.appendChild(volume_s);
		
		
		var pllistlevel = $('#playlist-level',d);
		
		var search_form = $('#search',d); 
		

		var ui_samples = $('#ui-samples',d);
		var buttmen_node =  ui_samples.children('.play-controls.buttmen');
		if (buttmen_node){
			seesu.buttmen = new button_menu(buttmen_node);
		}
		//
		
		sui.els = {
			scrolling_viewport: su.env.as_application ? {node:$('#screens',d)} : {node: $(d.body), offset: true},
			slider: slider,
			navs: $(slider).children('.navs'),
			start_screen: $('#start-screen',d),
			artcards: $('#art-cards', d),
			pllistlevel: pllistlevel,
			artsTracks: pllistlevel.find('#tracks-magic'),
			searchres: $('#search_result',d),
			search_input: $('#q',d),
			play_controls: seesu.buttmen,
			search_form: search_form,
			volume_s: volume_s
			
		};

		var vklc = ui_samples.children('.vk-login-context');

		var track_c = ui_samples.children('.track-context');
		sui.samples = {
			artcard: ui_samples.children('.art-card'),
			track_c : track_c,
			playlist_panel: ui_samples.children('.play-list-panel'),
			vklc: vklc,
			vk_login: {
				o: vklc,
				oos: $(),
				hideLoadIndicator: function(){
					this.oos.removeClass("waiting-vk-login");
					this.load_indicator = false;
				},
				showLoadIndicator:function() {
					this.oos.addClass("waiting-vk-login");
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
						nvk.addClass("waiting-vk-login");
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
							})
						
						}
							
						
						e.preventDefault();
					});
					
					_this.oos =  _this.oos.add(nvk);
					return nvk;
				}
			}
			
		};
		//vk_auth_box.setUI(sui.samples.vk_login);
		
			
		sui.els.search_label = sui.els.search_form.find('#search-p').find('.lbl');
		var justhead = sui.els.navs;
		sui.nav = {
			justhead: justhead,
			daddy: justhead.children('.daddy')
		};

		justhead.children('.daddy').empty().removeClass('not-inited');
		

		if (app_env.pokki_app){
			$('<span class="minimize-button"></span>').click(function(){
				pokki.closePopup();
			}).appendTo(justhead);
		}

		sui.els.search_input.on('keyup change', input_change);

		$(d).click(function(e) {
			return test_pressed_node(e);
		});
		var ext_search_query = sui.els.search_input.val();
		if (ext_search_query) {
			sui.search(ext_search_query);
		}
		if (cb){
			cb({has_query: !!ext_search_query})
		}
	});
}