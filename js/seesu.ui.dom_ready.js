window.connect_dom_to_som = function(d, ui){
	if (!window.window_resized){
		window_resizer(d);
	}

	ui.buttons = {
		search_artists : 
			$('<button type="submit" name="type" value="artist" id="search-artist"><span>Search in artists</span></button>',d)
				.click(function(e){
					var finishing_results = $(this).data('finishing_results');
					$(this).parent().remove();
					var query = seesu.ui.els.search_input.val();
					if (query) {
						su.fs.artist_search(query, finishing_results);
					}
					seesu.ui.make_search_elements_index()
				}),
			
		search_tags:  
			$('<button type="submit" name="type" value="tag" id="search-tag"><span>Search in tags</span></button>',d)
				.click(function(e){
					var finishing_results = $(this).data('finishing_results');
					$(this).parent().remove();
					
					
					var query = seesu.ui.els.search_input.val();
					if (query) {
						su.fs.tag_search(query, finishing_results)
					}
					seesu.ui.make_search_elements_index()
				}),
		search_tracks: 
			$('<button type="submit" name="type" value="track" id="search-track"><span>Search in tracks</span></button>',d)
				.click(function(e){
					var finishing_results = $(this).data('finishing_results');
					$(this).parent().remove();
					
					
					
					
					var query = seesu.ui.els.search_input.val();
					if (query) {
						su.fs.track_search(query, finishing_results)
					}
					seesu.ui.make_search_elements_index()
				}),
		search_vkontakte: 
			$('<button type="submit" name="type" value="vk_track" id="search-vk-track" class="search-button"><span>Use dirty search</span></button>',d)
				.click(function(e){
					
					var query = seesu.ui.els.search_input.val();
					if (query) {
						su.ui.show_track(query)
					}
					
				})
	};
	
	
	seesu.player.controls = (function(volume){
		var o = {};
		var get_click_position = function(e, node){
			var pos = e.offsetX || (e.pageX - $(node).offset().left);
			return pos
		}
		o.track_progress_total = $('<div class="track-progress"></div>',d).click(function(e){
			e.stopPropagation();
			var pos = get_click_position(e, this);
			var new_play_position_factor = pos/o.track_progress_width;
			seesu.player.musicbox.set_new_position(new_play_position_factor);
			
		})
		
		o.track_progress_load = $('<div class="track-load-progress"></div>',d).appendTo(o.track_progress_total);
		o.track_progress_play = $('<div class="track-play-progress"></div>',d).appendTo(o.track_progress_total);
		o.track_node_text = $('<div class="track-node-text"><div>',d).appendTo(o.track_progress_total);
		
		
		o.volume_state = $('<div class="volume-state"></div>',d).click(function(e){
			var pos = get_click_position(e, this);
			var new_volume_factor = pos/50;
			seesu.player.musicbox.changhe_volume(new_volume_factor * 100);
			seesu.player.call_event(VOLUME, new_volume_factor * 100);
			
			o.volume_state_position.css('width', pos + 'px')
		})
		o.volume_state_position = $('<div class="volume-state-position"></div>',d)
			.css('width',((volume * 50)/100) + 'px')
			.appendTo(o.volume_state);
		return o;
	})(seesu.player.player_volume);
	
	addEvent(d, "DOMContentLoaded", function() {
		dstates.connect_ui(ui);
		var artsHolder	= $('#artist-holder',d);
		var buttmen_node =  $('.play-controls.buttmen',d);
		if (buttmen_node){
			seesu.buttmen = new button_menu(buttmen_node);
		}
		var search_form = $('#search',d).submit(function(){return false;}); 
		var vk_auth = $('.vk-auth',d).submit(function(){
			seesu.ui.els.vk_login_error.text('');
			dstates.remove_state('body','vk-needs-captcha');
			var _this = $(this),
				email = $('input.vk-email',_this).val(),
				pass = $('input.vk-pass',_this).val();
			if (vk_save_pass.attr('checked')){
				w_storage('vk_save_pass', 'true', true);
				seesu.vk.save_pass = true;
			} else{
				w_storage('vk_save_pass', '', true);
				seesu.vk.save_pass = false;
			}
			vk_send_captcha($('#vk-captcha_key',_this).val(),email,pass);
	
			return false;
		});
		
		
		$('<div class="player-holder"></div>',d)
			.prepend(seesu.player.controls.track_progress_total)
			.prepend(seesu.player.controls.volume_state)
			.prependTo($('#track-panel',d));
			
			
		ui.els = {
			scrolling_viewport: $('#screens',d),
			make_trs: $("#make-trs-plable",d).click(function(){
				make_tracklist_playable(make_trs.hide().data('pl'), true);
				seesu.track_event('Controls', 'make playable all tracks in playlist'); 
			}),
			slider: d.getElementById('slider'),
			nav_playlist_page: d.getElementById('nav_playlist_page'),
			nav_track_zoom: $('#nav_track_zoom',d),
			export_playlist: $('#open-external-playlist',d),
			start_screen: $('#start-screen',d),
			artsHolder: artsHolder,
			a_info: $('.artist-info', artsHolder),
			artsTracks: $('.tracks-for-play',artsHolder),
			art_tracks_w_counter: $('#tracks-waiting-for-search',d),
			vk_login_error: $('.error',vk_auth),
			captcha_img: $('.vk-captcha-context img',vk_auth),
			searchres: $('#search_result',d),
			search_input: $('#q',d).keyup(input_change).mousemove(input_change).change(input_change),
			play_controls: seesu.buttmen,
			search_form: search_form
		};
		
		if (window.su && su.player && su.player.c_song){
			if (su.player.c_song.mo_titl && su.player.c_song.mo_titl.plst_titl){
				su.ui.render_playlist(su.player.c_song.mo_titl.plst_titl);
				su.ui.views.show_playlist_page(su.player.c_song.mo_titl.plst_titl);
				su.player.set_current_song(su.player.c_song, true, true);
				su.ui.views.save_view(su.player.c_song.mo_titl.plst_titl,true);
				su.ui.mark_c_node_as(su.player.player_state);
			}
		}
	
		$(d).click(function(e) {
			return test_pressed_node(e.target);
		});
		
		
		
		$('#hint-query',d).text(seesu.popular_artists[(Math.random()*10).toFixed(0)]);
		$('#widget-url',d).val(location.href.replace('index.html', ''));
		var seesu_me_link = $('#seesu-me-link',d);
		seesu_me_link.attr('href', seesu_me_link.attr('href').replace('seesu%2Bapplication', seesu.env.app_type));
		
		$('#start_search',d).click(function(){
			seesu.ui.views.show_start_page(true, true);
		});
		$(seesu.ui.els.nav_playlist_page).parent().click(function(){
			$(seesu.ui.els.slider).removeClass('show-zoom-to-track');
			seesu.track_page('playlist');
		});
		$('#search_result_nav',d).click(function(){
			seesu.ui.views.show_search_results_page(true, true);
		});
		
		
		
		var vk_save_pass = $('#vk-save-pass',d);
		
		  
	  	if ($.browser.opera && ((typeof opera.version == 'function') && (parseFloat(opera.version()) <= 10.1)) ){
	  		
			$('<a id="close-widget">&times;</a>',d)
				.click(function(){
					window.close();
				})
				.prependTo(seesu.ui.els.slider)
		}
	  
		
		
		
		
	
		
	
		
		
		
		
	
		if (lfm_scrobble.scrobbling) {
			var lfm_ssw = $('#scrobbling-switches',d);
			if (lfm_ssw) {
				lfm_ssw.find('.enable-scrobbling').attr('checked', 'checked');
				lfm_ssw.find('.disable-scrobbling').attr('checked', '');
			}
		}
		
		if (lfm_auth.sk) {
			seesu.ui.lfm_logged();	
		}
		
		
		
		
	
		
		var lfm_fin_recomm_check = $('#login-lastfm-finish-recomm-check',d),
			lfm_fin_recomm		 = $('#login-lastfm-finish-recomm',d);
		var lfm_fin_loved_check  = $('#login-lastfm-finish-loved-check',d),
			lfm_fin_loved		 = $('#login-lastfm-finish-loved',d);
			
			
		lfm_fin_recomm_check.change(function(){
			if ($(this).attr('checked')) {
				lfm_fin_recomm.attr('disabled', null);
			} else {
				lfm_fin_recomm.attr('disabled', 'disabled');
			}
		});
		lfm_fin_loved_check.change(function(){
			if ($(this).attr('checked')) {
				lfm_fin_loved.attr('disabled', null);
			} else {
				lfm_fin_loved.attr('disabled', 'disabled');
			}
		});
		lfm_fin_recomm.click(function(){
			if(lfm_fin_recomm_check.attr('checked')){
				lfm('auth.getSession',{'token':lfm_auth.newtoken },function(r){
					if (!r.error) {
						lfm_auth.login(r);
						render_recommendations();
					}
				});
				return false
			}
		});
		lfm_fin_loved.click(function(){
			if(lfm_fin_loved_check.attr('checked')){
				lfm('auth.getSession',{'token':lfm_auth.newtoken },function(r){
					if (!r.error) {
						lfm_auth.login(r);
						render_loved();
					}
				});
				return false
			}
		})
		
		$('#lfm-recomm',d).click(function(){
			if(!lfm_auth.sk){
				$(d.body).toggleClass('lfm-auth-req-recomm');
			}else {
				render_recommendations();
			}
		})
		$('#lfm-loved',d).click(function(){
			if(!lfm_auth.sk){
				$(d.body).toggleClass('lfm-auth-req-loved');
			}else {
				render_loved();
			}
		})
		$('#lfm-loved-by-username',d).submit(function(){
			var _this = $(this);
			render_loved(_this[0].loved_by_user_name.value);
			$(d.body).removeClass('lfm-auth-req-loved');
			return false;
		})
		$('#lfm-recomm-for-username',d).submit(function(e){
			var _this = $(this);
			render_recommendations_by_username(_this[0].recomm_for_username.value);
			$(d.body).removeClass('lfm-auth-req-recomm');
			return false;
		})
	
	
	
	
		if (d.activeElement.nodeName != 'INPUT') {
			ui.els.search_input[0].focus();
		}
		
		$('#app_type', search_form).val(seesu.env.app_type);
		if (search_form) {
			$(d).keydown(function(e){
				if (!seesu.ui.els.slider.className.match(/show-search-results/)) {return}
				if (d.activeElement.nodeName == 'BUTTON'){return}
				arrows_keys_nav(e);
			})
		}
		
		var ext_search_query = seesu.ui.els.search_input.val();
		if (ext_search_query) {
			input_change(seesu.ui.els.search_input[0])
		}
	});
	
	var preload_query = d.getElementsByName('search_query');
	if (preload_query && preload_query.length){
		if (preload_query[0] && preload_query[0].content){
			lfm('artist.search',{artist: preload_query[0].content, limit: 15 },function(){ })
			lfm('tag.search',{tag: preload_query[0].content, limit: 15 },function(){ })
			lfm('track.search',{track: preload_query[0].content, limit: 15 },function(){ })
		}
	}

}