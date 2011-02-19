var get_youtube = function(q, callback){
	var cache_used = cache_ajax.get('youtube', q, callback);
	if (!cache_used){
		$.ajax({
			url: 'http://gdata.youtube.com/feeds/api/videos',
			dataType: 'jsonp',
			data: {
				q: q,
				v: 2,
				alt: 'json-in-script'
				
			},
			success: function(r){
				if (callback) {callback(r);}
					cache_ajax.set('youtube', q, r)
				} 
		})
	}
	
};

var get_all_tracks = function(trackname, callback, nocache, hypnotoad, only_cache){
	var allow_h = hypnotoad && seesu.delayed_search.waiting_for_mp3provider;
	if (seesu.delayed_search.use.queue) {seesu.delayed_search.use.queue.reset();}
	seesu.delayed_search.tracks_waiting_for_search = 0;
	seesu.ui.els.art_tracks_w_counter.text('');
	var s = allow_h ? seesu.hypnotoad.search_soundcloud : seesu.delayed_search.use.search_tracks;
	var used_successful = s(trackname, callback, function(){callback();}, nocache, false, only_cache);
	if (typeof used_successful == 'object'){
		used_successful.pr = seesu.player.want_to_play + 1;
		used_successful.q.init();
	}
	return used_successful;
}

var get_track = function(mo, nocache, hypnotoad, only_cache, get_next){
	var allow_h = hypnotoad && seesu.delayed_search.waiting_for_mp3provider;
	if(mo.ready_for_play){
		return false;
	}
	
	if (!nocache && !only_cache && !hypnotoad){
		seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search += 1) || '');
	}
	var s = allow_h ? seesu.hypnotoad.search_soundcloud : seesu.delayed_search.use.search_tracks;
	var last_hypnotoad_try = false;
	var callback_success = function(music_list){
		//success
		if (mo.ready_for_play){
			return false
		}
		
		mo.node.removeClass('search-mp3');
		var best_track = get_best_track(music_list,mo.artist,mo.track);
		make_node_playable(mo, best_track);
		seesu.ui.els.export_playlist.addClass('can-be-used');
		if (!nocache && !only_cache && !hypnotoad){
			seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		}
		
	}
	
	var callback_error = function(xhr){
		//error
		if(mo.ready_for_play){
			return false;
		}
		if (!mo.not_use){

			
			if (allow_h && seesu.hypnotoad.vk_api && !last_hypnotoad_try ){
			
				last_hypnotoad_try = true;
				seesu.hypnotoad.search_tracks(
					mo.artist + ' - ' + mo.track, callback_success, callback_error, 
					nocache,
					function(){
						if(mo.ready_for_play){
							return false;
						}
						mo.node.addClass('search-mp3');
					}
				)
				
			} else{
				if (get_next){
					mo.not_use=true;
					if ((seesu.player.current_next_song && (mo == seesu.player.current_next_song)) || 
						(seesu.player.current_prev_song && (mo == seesu.player.current_prev_song))){
						seesu.player.fix_songs_ui();
					}
					if (seesu.player.current_next_song && !seesu.player.current_next_song.ready_for_play){
						get_next_track_with_priority(seesu.player.current_next_song);
					}
				}
				
			}
		} else{
			return false;
		}
		
		
		
		mo.node.removeClass('search-mp3').addClass('search-mp3-failed').removeClass('waiting-full-render');
		if (!nocache && !only_cache && !hypnotoad){
			seesu.ui.els.art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		}
		
	}
	var used_successful = s(
		mo.artist + ' - ' + mo.track, callback_success, callback_error, 
		nocache,
		function(){
			if(mo.ready_for_play){
				return false;
			}
			mo.node.addClass('search-mp3');
		},
		only_cache
	);
	if (typeof used_successful == 'object'){
		var has_pr = mo.want_to_play;
		if (has_pr) {
			used_successful.pr = has_pr;
		}
		mo.delayed_in.push(used_successful);
		used_successful.q.init();
	}
	
	return used_successful;
}

var de_html_entity = document.createElement('div');
var de_html = function(html_text){
	de_html_entity.innerHTML = html_text;
	return de_html_entity.textContent;
}
var reg_exp_string_fix;
var get_best_track = function(array,artist,track){
	var best = array[0],
	worst_pr = -7; //six steps search
	
	for (var i=0,l=array.length; i < l; i++) {
		var _ar = de_html(array[i].artist),
			_tr = de_html(array[i].track);
		artist = de_html(artist)
		track = de_html(track)
		var epic_fail;
		
		var for_first_test = artist + ' ' + track;
		epic_fail = !~for_first_test.indexOf(artist) && !~for_first_test.indexOf(track);
		
		if (!epic_fail){
			if ((_ar == artist) && (_tr == track)){
				return array[i];
			} else
			if ((_ar.toLowerCase() == artist.toLowerCase()) && (_tr.toLowerCase() == track.toLowerCase())){
				best = array[i];
				worst_pr = -1;
			} else
			if ( (worst_pr < -2) && (_ar.replace(/The /g, '') == artist.replace(/The /g, '')) && (_tr == track)){
				best = array[i];
				worst_pr = -2;
			} else
			if ( (worst_pr < -3) && (_ar.replace(/The /g, '') == artist.replace(/The /g, '')) && (_tr.replace(/.mp3/g, '') == track)){
				best = array[i];
				worst_pr = -3;
			} else
			if ( (worst_pr < -4) && (_ar.toLowerCase() == artist.replace("The ").toLowerCase()) && (_tr.toLowerCase() == track.toLowerCase())){
				best = array[i];
				worst_pr = -4;
			} else 
			if ( (worst_pr < -5) && ~_ar.indexOf(artist) && ~_tr.indexOf(track)) {
				best = array[i];
				worst_pr = -5;
			} else
			if ( (worst_pr < -6) && ~_ar.toLowerCase().indexOf(artist.toLowerCase()) && ~_tr.toLowerCase().indexOf(track.toLowerCase())) {
				best = array[i];
				worst_pr = -6;
			} else {
				best = array[i];
				worst_pr = -7;
			}
		}
		
		
	};
	return best;
}
var kill_music_dubs = function(array) {
	var cleared_array = [];
	for (var i=0; i < array.length; i++) {
		if (!has_music_copy(array, array[i], i+1)){
			cleared_array.push(array[i]);
		}
	}
	return cleared_array
}
var has_music_copy = function(array, entity, from_position){
	if (!array.length) {return false}
	
	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist == entity.artist) && (array[i].track == entity.track) && (array[i].duration == entity.duration)) {
			return true;
		}
	};
}

var mp3_prov_selected = w_storage('mp3-search-way');
var have_mp3_provider;
window.prov_count_down = 1;
var provider_selected;

window.swith_to_provider = function(try_selected){
	if (provider_selected) {return false}
	if (mp3_prov_selected && seesu.delayed_search.available && seesu.delayed_search.available.length){
	
		
		for (var i=0; i < seesu.delayed_search.available.length; i++) {
			var current_prov = seesu.delayed_search.available[i];
			if (current_prov == mp3_prov_selected){
				seesu.delayed_search['switch_to_' + current_prov]();
				provider_selected = true;
				console.log('selected prov ' + current_prov);
			}
		};
		if (!provider_selected && !try_selected){
			var current_prov = seesu.delayed_search.available[0];
			if (current_prov){
				seesu.delayed_search['switch_to_' + current_prov]();
				provider_selected = true;
				console.log('not selected prov ' + current_prov);
			} else{
				console.log('must use vkontakte');
			}
		}
		
	} else if (!try_selected){
		var someone_available = seesu.delayed_search.available[0];
		if (someone_available){
			seesu.delayed_search['switch_to_' + someone_available]();
			console.log('some avai prov ' + someone_available)
		} else{
			console.log('must use vkontakte');
		}
	}
}
window.swith_to_provider_finish = function(){
	prov_count_down--;
	if (prov_count_down == 0){
		swith_to_provider();
	}
}




window.try_hard_vk_working = function(callback){
	var try_to_auth = function(){
		var login = w_storage( 'vk_auth_login');
		var pass = w_storage( 'vk_auth_pass');
		if (login && pass){
			console.log('we have pass in storage')
			vk_send_captcha('', login, pass)
		}
	};
	
	$.ajax({
	  url: "http://vk.com/feed2.php",
	  global: false,
	  type: "GET",
	  dataType: "text",
	  timeout: 7000,
	  beforeSend: seesu.vk.set_xhr_headers,
	  success: function(text){
		if (text.match(/^\{/) && text.match(/\}$/)){
			try {
				var r = $.parseJSON(text);
				if (r.user && r.user.id) {
					if (callback){
						callback(r);
					} else{
						seesu.delayed_search.available.push('vk');
						seesu.vk_logged_in = true;
						console.log('vk mp3 prov ok')
						swith_to_provider(true)
					}
				} else{
					vk_logged_out();
					console.log('vk mp3 prov faild');
					try_to_auth();
				
					
					
				}
			} catch(e) {
				console.log(e)
			}
		} else{
			vk_logged_out();
			console.log('vk mp3 prov faild (can not parse)');
			try_to_auth();
			
		}
	  },
	  error: function(xhr){
		console.log('vk mp3 prov faild with jq error')
		vk_logged_out();
	  },
	  complete: function(xhr){
		swith_to_provider_finish();
	  }

	});
}
window.try_api = function(){
	var remove_iframe = function(e){
		setTimeout(function(){
			$(e.target).remove();
			console.log('removed!');
		},5000)
	}
	
	var tvk_ru =  $('<iframe id="test_vk_auth_ru" class="serv-container" src="http://vkontakte.ru/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html"></iframe>')
		.bind('load',remove_iframe);
	var tvk_com = $('<iframe id="test_vk_auth_com" class="serv-container" src="http://vk.com/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html"></iframe>')
		.bind('load',remove_iframe);
	$('#slider-materail').append(tvk_ru).append(tvk_com);
};

try_mp3_providers = function(){
	if (seesu.env.cross_domain_allowed){
		try_hapi();
	} else{
		console.log('heyayy!')
		addEvent(window, "message", listen_vk_api_callback_window);
		try_api();

	}
  	
	
}	
