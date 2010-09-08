$(function() {
  if (lfm_auth.sk && !lfm_scrobble.s) {lfm_scrobble.handshake();}
  if (seesu.cross_domain_allowed) {check_seesu_updates();}
  seesu.vk_id = w_storage('vkid');
  $(document).click(function(e) {
	return test_pressed_node(e.target)
  });
	flash_secur = $('#flash-secur');

	$('#hint-query').text(seesu.popular_artists[(Math.random()*10).toFixed(0)])
	var wgt_urli = $('#widget-url').val(location.href.replace('index.html', ''));
	window.seesu_me_link = $('#seesu-me-link');
	seesu_me_link.attr('href', seesu_me_link.attr('href').replace('seesu%2Bapplication', seesu.env.app_type))

  
  
	//see var at top
	window.slider = document.getElementById('slider');
	window.startlink = document.getElementById('start_search');
	startlink.onclick = function(){
		slider.className = "show-start";
		search_input[0].focus();
		search_input[0].select();
	};
	
	window.nav_artist_page = document.getElementById('nav_artist_page');
	window.trk_page_nav = document.getElementById('nav_tracks_page');
	search_nav.click(function(){
		slider.className = "show-search show-search-results";
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
	
	window.playlist_panel = $('#play-list-panel');
	
	
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
			
			
		if (true) {
			vk_send_captcha($('#vk-captcha_key',_this).val(),email,pass);
		} else {
			vk_login(email,pass);
		}
		
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

});
