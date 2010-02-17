var slider , searchfield ,srnav ,startlink, searchres, art_page_nav, play_controls,
	artsHolder,artsImage,artsBio,artsTracks,artsName,artsplhld,art_tracks_w_counter,
	captcha_img,vk_login_error;
$(function() {
  $(document).click(function(e) {
  	var node = e.target;
  	var class_name = node.className;
	var clicked_node = $(e.target);

	if(clicked_node.is('a')) {

	  if (class_name.match(/song/)){
		return song_click(clicked_node);
	  }	
	  else if (class_name.match(/waiting-full-render/)){
		if (seesu.player.wainter_for_play) {seesu.player.wainter_for_play.removeClass('marked-for-play');}
		clicked_node.data('want_to_play', seesu.player.want_to_play += 1).addClass('marked-for-play');
		seesu.player.wainter_for_play = clicked_node;
		return false;
	  }
	  else if (class_name.match(/vk-reg-ref/)){
		widget.openURL(vkReferer);
		return false;
	  }
	  else if (class_name.match(/flash-s$/)){
		widget.openURL('http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html');
		return false;
	  }
	  else if (class_name.match(/twitter/)){
		var tweet_text = "Seesu plays last.fm for free and lets me to download tracks #seesu http://bit.ly/4s6CKa";
		if (seesu.player.current_artist) {tweet_text += " Now I'm listening «" + seesu.player.current_artist + "»" };
		widget.openURL( 'http://twitter.com/home/?status=' + encodeURIComponent(tweet_text));
		return false;
	  }
	  else if (class_name.match(/artist/)){
		artist_name = decodeURIComponent(clicked_node.data('artist'));
		set_artist_page(artist_name);
		return false;
	  }
	  else if (class_name.match(/music-tag/)){
		tag_name = decodeURIComponent(clicked_node.data('music_tag'));
		render_tracks_by_artists_of_tag(tag_name);
		return false;
	  }
	  else if (class_name.match(/bbcode_artist/)){
		artist_name = decodeURIComponent(clicked_node.attr('href').replace('http://www.last.fm/music/',''));
		set_artist_page(artist_name);
		return false;
	  }
	  else if (class_name.match(/bbcode_tag/)){
		tag_name = decodeURIComponent(clicked_node.attr('href').replace('http://www.last.fm/tag/',''));
		render_tracks_by_artists_of_tag(tag_name);
		return false;
	  }
	  else if (class_name.match(/artist-list/)){
		proxy_render_artists_tracks(clicked_node.data('artist_list'));
		$(art_page_nav).text('Similar to «' + seesu.player.current_artist + '»');
	  }
	} else if ((node.nodeName == 'IMG') && class_name.match(/pl-control/)){
		var class_name = node.parentNode.className;
		if (class_name.match(/pause/)){
			seesu.player.set_state('pause');
			return false; 
		} 
		else if (class_name.match(/play$/)){
			seesu.player.set_state('play');
			return false; 
		}
		else if (class_name.match(/stop/)){
			seesu.player.set_state('stop');
			return false; 
		}
		else if (class_name.match(/play_prev/)){
			if(seesu.player.current_song) {seesu.player.switch_to('prev');}
			return false;
		}
		else if (class_name.match(/play_next/)){
			if(seesu.player.current_song) {seesu.player.switch_to('next');}
			return false;
		}
	  
	} else if ((node.nodeName == 'DIV') && class_name.match(/flash-security-status/)){
		var p  = clicked_node.parent().parent().position();
		if (clicked_node.data('showing')) {
			$('.flash-secur').css({'display': ''});
			clicked_node.removeData('showing');
		} else{
			$('.flash-secur').css({'top': p.top + 60, 'display': 'block'});
			clicked_node.data('showing',true);
		}
		
		
	  }
  });
	play_controls = $('.play-controls');
	var about_jnode = $('#about');
	$('.logo',about_jnode).hover(function(){
		about_jnode.addClass('logoover');
	});
	$('.avatar',about_jnode).click(function(){
		about_jnode.toggleClass('tweet-about-seesu');
	});
  
	$('#close-widget').click(function(){
		window.close();
	});

	//see var at top
	slider = document.getElementById('slider');
	searchfield = document.getElementById('q');
	srnav = document.getElementById('search_result_nav');
	startlink = document.getElementById('start_search');
	searchres = document.getElementById('search_result');
	art_page_nav = document.getElementById('nav_artist_page');
	trk_page_nav = document.getElementById('nav_tracks_page');
	startlink.onclick = function(){
	slider.className = "screen-start";
	};
	srnav.onclick = function(){
	slider.className = "screen-search";
	};
	
	
	if (!(document.activeElement.nodeName == 'INPUT')) {
		searchfield.focus();
	}
	
	
	artsHolder	= $('#artist-holder');
	artsImage	= $('img.artist-image',artsHolder);
	artsBio		= $('.artist-bio',artsHolder);
	artsTracks	= $('.tracks-for-play',artsHolder);
	artsplhld	= $('.player-holder',artsHolder);
	art_tracks_w_counter = $('.tracks-waiting-for-search',artsHolder)
	artsName	= $('#artist-name');
		
	var flash_settings = $('.internet-flash-settings input');
		
	flash_settings.change(function(){
		if($(this).attr('checked')) {
			widget.setPreferenceForKey('true', 'flash_internet');
			$(document.body).addClass('flash-internet');
		} else {
			widget.setPreferenceForKey(null, 'flash_internet');
			$(document.body).removeClass('flash-internet');
		}
	});
	
	if (widget.preferenceForKey('flash_internet') == 'true') {
		$(document.body).addClass('flash-internet');
		flash_settings.attr('checked', 'checked');
	}
	
	
	
	var vk_auth = $('.vk-auth').submit(function(){
		vk_login_error.text('');
		$(document.body).removeClass('vk-needs-captcha');
		var _this = $(this),
			email = $('input.vk-email',_this).val(),
			pass = $('input.vk-pass',_this).val();
		if (true) {
			vk_send_captcha($('#vk-captcha_key',_this).val(),email,pass);
		} else {
			vk_login(email,pass);
		}
		
		return false;
	});
	captcha_img = $('.vk-captcha-context img',vk_auth);
	vk_login_error = $('.error',vk_auth);
	
	  seesu.vk_id = widget.preferenceForKey('vkid');
	  if ((typeof(seesu.vk_id) == 'string') && (seesu.vk_id != 'false')) {
		$(document.body).addClass('vk-logged-in');
		vk_logged_in = true;
		vk_login_check();
	  } else{
		log('not loggin in');
	  }
	
	
	
	$('#search-artist').click(function(){
		var query = searchfield.value;
		if (query) {
			artistsearch(query);
		}
		
		
	});
	$('#search-tag').click(function(){
		var _this = $(this);
		var query = searchfield.value;
		if (query) {
			render_tracks_by_artists_of_tag(query);
		}
		
	});
	$('#search-track').click(function(e){
		var _this = $(this);
		var query = searchfield.value;
		if (query) {
			vk_track_search(query)
		}
		
	});
	
	
	var get_lfm_token = function(lfm_auth,callback){
		lfm('auth.getToken',false,function(r){
			lfm_auth.newtoken = r.token;
			if (callback) {callback(lfm_auth.newtoken);}
		})
	}
	var open_lfm_to_login = function(token){
		widget.openURL('http://www.last.fm/api/auth/?api_key=' + apikey + '&token=' + token);
		$(document.body).addClass('lfm-waiting-for-finish');
	};
	
	if (!lfm_auth.sk) {
		get_lfm_token(lfm_auth);
	}

	$('.login-lastfm-button').click(function(){

		
		if (lfm_auth.newtoken) {
			open_lfm_to_login(lfm_auth.newtoken);
		} else {
			get_lfm_token(lfm_auth,open_lfm_to_login);
		}
		
		return false
	})
	
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
	})
	$('#lfm-recomm-for-username').submit(function(){
		var _this = $(this);
		render_recommendations_by_username(_this[0].recomm_for_username.value);
		$(document.body).removeClass('lfm-auth-req-recomm');
	})
	zz = new vk_api(seesu.vk_id,'SRkM2ws8NQ','35569' );

});