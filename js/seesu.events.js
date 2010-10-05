$(function() {
  if (seesu.cross_domain_allowed && lfm_auth.sk && !lfm_scrobble.s) {lfm_scrobble.handshake();}
  check_seesu_updates();
  seesu.vk_id = w_storage('vkid');
  $(document).click(function(e) {
	return test_pressed_node(e.target)
  });
  seesu.ui.scrolling_viewport = $('#screens');
  try_mp3_providers();
	flash_secur = $('#flash-secur');

	$('#hint-query').text(seesu.popular_artists[(Math.random()*10).toFixed(0)])
	var wgt_urli = $('#widget-url').val(location.href.replace('index.html', ''));
	window.seesu_me_link = $('#seesu-me-link');
	seesu_me_link.attr('href', seesu_me_link.attr('href').replace('seesu%2Bapplication', seesu.env.app_type))

  
  
	//see var at top
	window.slider = document.getElementById('slider');
	window.startlink = document.getElementById('start_search');
	startlink.onclick = function(){
		
		seesu.ui.views.show_start_page(true, true);
	};
	
	window.nav_playlist_page = document.getElementById('nav_playlist_page');
	$(nav_playlist_page).parent().click(function(){
		var current_page = slider.className;
		$(slider).removeClass('show-zoom-to-track');
		seesu.track_event('Navigation', 'playlist', current_page);
	})
	window.nav_track_zoom = $('#nav_track_zoom');
	window.trk_page_nav = document.getElementById('nav_tracks_page');
	
	window.search_nav = $('#search_result_nav').click(function(){
		seesu.ui.views.show_search_results_page(true, true);
	});
	window.export_playlist = $('#open-external-playlist');
	seesu.start_screen = $('#start-screen');
	
	window.artsHolder	= $('#artist-holder');
	window.a_info		= $('.artist-info', artsHolder)
	window.artsName		= $('.artist-name',  a_info);
	window.artsImage	= $('img.artist-image',a_info);
	window.artsBio		= $('.artist-bio',a_info);
	window.arst_meta_info = $('.artist-meta-info', a_info);
	
	window.artsTracks	= $('.tracks-for-play',artsHolder);
	window.art_tracks_w_counter = $('#tracks-waiting-for-search');
	
	window.track_panel = $('#track-panel');
	
	
	window.vk_save_pass = $('#vk-save-pass');
	
	  
  	if ($.browser.opera && ((typeof opera.version == 'function') && (parseFloat(opera.version()) <= 10.1)) ){
  		
		$('<a id="close-widget">&times;</a>')
			.click(function(){
				window.close();
			})
			.prependTo(slider)
	}
  
	
	
	
	
	var flash_settings = $('.internet-flash-settings input');
		
	flash_settings.click(function(){
		
	});
	

	
	
	var vk_auth = $('.vk-auth').submit(function(){
		vk_login_error.text('');
		$(document.body).removeClass('vk-needs-captcha');
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
	captcha_img = $('.vk-captcha-context img',vk_auth);
	vk_login_error = $('.error',vk_auth);

	if (lfm_scrobble.scrobbling) {
		var lfm_ssw = $('#scrobbling-switches');
		if (lfm_ssw) {
			lfm_ssw.find('.enable-scrobbling').attr('checked', 'checked');
			lfm_ssw.find('.disable-scrobbling').attr('checked', '');
		}
	}
	
	if (lfm_auth.sk) {
		lfm_auth.ui_logged();	
	}
	var get_lfm_token = function(lfm_auth,callback){
		lfm('auth.getToken',false,function(r){
			lfm_auth.newtoken = r.token;
			if (callback) {callback(lfm_auth.newtoken);}
		})
	}
	open_lfm_to_login = function(token){
		widget.openURL('http://www.last.fm/api/auth/?api_key=' + apikey + '&token=' + token);
		$(document.body).addClass('lfm-waiting-for-finish');
	};
	
	if (!lfm_auth.sk) {
		get_lfm_token(lfm_auth);
	}

	
	var lfm_fin_recomm_check = $('#login-lastfm-finish-recomm-check'),
		lfm_fin_recomm		 = $('#login-lastfm-finish-recomm');
	var lfm_fin_loved_check  = $('#login-lastfm-finish-loved-check'),
		lfm_fin_loved		 = $('#login-lastfm-finish-loved');
		
		
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
	
	$('#lfm-recomm').click(function(){
		if(!lfm_auth.sk){
			$(document.body).toggleClass('lfm-auth-req-recomm');
		}else {
			render_recommendations();
		}
	})
	$('#lfm-loved').click(function(){
		if(!lfm_auth.sk){
			$(document.body).toggleClass('lfm-auth-req-loved');
		}else {
			render_loved();
		}
	})
	$('#lfm-loved-by-username').submit(function(){
		var _this = $(this);
		render_loved(_this[0].loved_by_user_name.value);
		$(document.body).removeClass('lfm-auth-req-loved');
		return false;
	})
	$('#lfm-recomm-for-username').submit(function(e){
		var _this = $(this);
		render_recommendations_by_username(_this[0].recomm_for_username.value);
		$(document.body).removeClass('lfm-auth-req-recomm');
		return false;
	})
	play_controls = $('.play-controls');




	window.searchres = $('#search_result');
	window.search_input = $('#q')
		.keyup(input_change)
		.mousemove(input_change)
		.change(input_change);
	if (document.activeElement.nodeName != 'INPUT') {
		search_input[0].focus();
	}
	seesu.ui.search_form = $('#search').submit(function(){return false;});
	$('#app_type', seesu.ui.search_form).val(seesu.env.app_type);
	if (seesu.ui.search_form) {
		$(document).keydown(function(e){
			if (!slider.className.match(/show-search-results/)) {return}
			if (document.activeElement.nodeName == 'BUTTON'){return}
			var _key = e.keyCode;
			if (_key == '13'){
				e.preventDefault();
				var current_node = seesu.ui.views.current_rc.data('node_for_enter_press');
				if (current_node) {current_node.click()}
			} else 
			if((_key == '40') || (_key == '63233')){
				e.preventDefault();
				var current_node = seesu.ui.views.current_rc.data('node_for_enter_press');
				if (current_node){
					var _elements = seesu.ui.views.current_rc.data('search_elements');
					var el_index = current_node.data('search_element_index');
					var els_length = _elements.length;
					current_node.removeClass('active')
					
					if (el_index < (els_length -1)){
						var new_current = el_index+1;
						set_node_for_enter_press($(_elements[new_current]), true)
						
					} else {
						var new_current = 0;
						set_node_for_enter_press($(_elements[new_current]), true)
					}
				}
			} else 
			if((_key == '38') || (_key == '63232')){
				e.preventDefault();
				var current_node = seesu.ui.views.current_rc.data('node_for_enter_press');
				if (current_node){
					var _elements = seesu.ui.views.current_rc.data('search_elements');
					var el_index = current_node.data('search_element_index');
					var els_length = _elements.length;
					current_node.removeClass('active')
					
					if (el_index > 0){
						var new_current = el_index-1;
						set_node_for_enter_press($(_elements[new_current]), true)
						
					} else {
						var new_current = els_length-1;
						set_node_for_enter_press($(_elements[new_current]), true)
					}
				}
			}
		})
	}
	
	var ext_search_query = search_input.val();
	if (ext_search_query) {
		input_change(search_input[0])
	}
});

$(function(){
	var buttmen_node =  $('.buttmen');
	if (buttmen_node){
		seesu.buttmen = new button_menu(buttmen_node)
	}
	
	seesu.player.play_controls = seesu.buttmen;
})


// Ready? Steady? Go!

$(function() {
	seesu.ui.player_holder = $('<div class="player-holder"></div>')
		.prepend(seesu.player.controls.track_progress_total)
		.prepend(seesu.player.controls.volume_state);
	track_panel.prepend(seesu.ui.player_holder);
	
	var a = document.createElement('audio');
	if(!!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''))){
		seesu.player.musicbox = new html5_p(seesu.player.player_volume);
		$(document.body).addClass('flash-internet');
	} else if (!seesu.cross_domain_allowed){
		soundManager = new SoundManager();
		if (soundManager){
			soundManager.url = 'http://seesu.me/swf/';
			soundManager.flashVersion = 9;
			soundManager.useFlashBlock = true;
			soundManager.debugMode = false;
			soundManager.wmode = 'transparent';
			soundManager.useHighPerformance = true;
			soundManager.onready(function() {
			  if (soundManager.supported()) {
				console.log('sm2 in widget ok')
				seesu.player.musicbox = new sm2_p(seesu.player.player_volume, soundManager);
				$(document.body).addClass('flash-internet');
				try_to_use_iframe_sm2p(true);
			  } else {
			  	console.log('sm2 in widget notok')
			  		try_to_use_iframe_sm2p();
		
			  }
			});
		}
	} else {
		try_to_use_iframe_sm2p();
	}
	
	
	
	
		

	
});



var preload_query = document.getElementsByName('search_query');
if (preload_query && preload_query.length){
	if (preload_query[0] && preload_query[0].content){
		lfm('artist.search',{artist: preload_query[0].content, limit: 15 },function(){ })
		lfm('tag.search',{tag: preload_query[0].content, limit: 15 },function(){ })
		lfm('track.search',{track: preload_query[0].content, limit: 15 },function(){ })
	}
}
