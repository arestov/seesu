get_all_tracks = function(trackname, callback, was_unsuccessful){
	if (seesu.mp3_quene) {seesu.mp3_quene.reset();}
	seesu.delayed_search.tracks_waiting_for_search = 0;
	art_tracks_w_counter.text('');
	var used_successful = seesu.delayed_search.use.search_tracks(trackname, callback, function(){callback();}, was_unsuccessful);
	return used_successful;
}
get_track = function(tracknode, playlist_nodes_for, was_unsuccessful){
	if (!was_unsuccessful){
		art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search += 1) || '');
	}
	var used_successful = seesu.delayed_search.use.search_tracks(
		tracknode.data('artist_name') + ' - ' + tracknode.data('track_title'), 
		function(music_list){
			//success
			tracknode.removeClass('search-mp3');
			var best_track = search_from_list_one_track(music_list,tracknode.data('artist_name'),tracknode.data('track_title'));
			make_node_playable(tracknode, best_track.link, playlist_nodes_for, best_track.duration);
			resort_playlist(playlist_nodes_for);
			make_external_playlist(playlist_nodes_for);
			art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		},
		function(xhr){
			//error
			tracknode.removeClass('search-mp3').addClass('search-mp3-failed').removeClass('waiting-full-render');
			art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		}, 
		was_unsuccessful,
		function(){
			tracknode.addClass('search-mp3');
		}
	);
	return used_successful;
}

var de_html_entity = document.createElement('div');
var de_html = function(html_text){
	de_html_entity.innerHTML = html_text;
	return de_html_entity.textContent;
}
search_from_list_one_track = function(array,artist,track){
	var best = array[0],
	worst_pr = -7; //six steps search
	
	for (var i=0,l=array.length; i < l; i++) {
		var _ar = de_html(array[i].artist),
			_tr = de_html(array[i].track);
		artist = de_html(artist)
		track = de_html(track)
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
		if ( (worst_pr < -5) && _ar.match(artist) && _tr.match(track)) {
			best = array[i];
			worst_pr = -5;
		} else
		if ( (worst_pr < -6) && _ar.toLowerCase().match(artist.toLowerCase()) && _tr.toLowerCase().match(track.toLowerCase())) {
			best = array[i];
			worst_pr = -6;
		} 
		
	};
	return best;
}
kill_music_dubs = function(array) {
	var cleared_array = [];
	for (var i=0; i < array.length; i++) {
		if (!has_music_copy(array, array[i], i+1)){
			cleared_array.push(array[i]);
		}
	}
	return cleared_array
}
has_music_copy = function(array, entity, from_position){
	if (!array.length) {return false}
	
	for (var i = from_position || 0, l = array.length; i < l; i++) {
		if ((array[i].artist == entity.artist) && (array[i].track == entity.track) && (array[i].duration == entity.duration)) {
			return true;
		}
	};
}

var mp3_prov_selected = w_storage('mp3-search-way');
var have_mp3_provider;
window.prov_count_down = 2;
var provider_selected;

window.swith_to_provider = function(try_selected){
	if (provider_selected) {return false}
	if (mp3_prov_selected && seesu.delayed_search.available && seesu.delayed_search.available.length){
	
		
		for (var i=0; i < seesu.delayed_search.available.length; i++) {
			var current_prov = seesu.delayed_search.available[i];
			if (current_prov == mp3_prov_selected){
				seesu.delayed_search['switch_to_' + current_prov]();
				provider_selected = true;
				log('selected prov ' + current_prov);
			}
		};
		if (!provider_selected && !try_selected){
			var current_prov = seesu.delayed_search.available[0];
			if (current_prov){
				seesu.delayed_search['switch_to_' + current_prov]();
				provider_selected = true;
				log('not selected prov ' + current_prov);
			} else{
				log('must use vkontakte');
			}
		}
		
	} else if (!try_selected){
		var someone_available = seesu.delayed_search.available[0];
		if (someone_available){
			seesu.delayed_search['switch_to_' + someone_available]();
			log('some avai prov ' + someone_available)
		} else{
			log('must use vkontakte');
		}
	}
}
window.swith_to_provider_finish = function(){
	prov_count_down--;
	if (prov_count_down == 0){
		swith_to_provider();
	}
}
try_mp3_providers = function(){
	
	
	/*
	$.ajax({
	  url: "http://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20html%20WHERE%20url%3D'http%3A%2F%2Faudme.ru'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
	  success: function(r){

	  	if (!r.query.results){
	  		log(r.query.results)
			seesu.delayed_search.available.push('audme');
			$('#mp3way-audme').removeClass('cant-be-used');
			log('audme nice')
			swith_to_provider(true)	
		} else{
			log('audme error')
		}
		
		
		
	  },
	  timeout: 7000,
	  error: function(){
		log('audme error')
	  },
	  complete: function(){
		prov_count_down--;
		if (prov_count_down == 0){
			swith_to_provider();
		}
	  }
	})
	*/
  	if (seesu.vk.id && seesu.vk.big_vk_cookie) {
		$.ajax({
		  url: "http://vkontakte.ru/feed2.php",
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
						if (seesu.vk_api){
							if (!seesu.vk_api.test_mode) {
								seesu.vk_api.viewer_id = r.user.id;
							}
						}
				  		
						seesu.delayed_search.available.push('vk');
						seesu.vk_logged_in = true;
						log('vk mp3 prov ok')
						swith_to_provider(true)
					} else{
						vk_logged_out();
						log('vk mp3 prov faild');
						
						
						var login = w_storage( 'vk_auth_login');
						var pass = w_storage( 'vk_auth_pass');
						if (login && pass){
							vk_send_captcha('', login, pass, function(){
								seesu.delayed_search.available.push('vk');
								swith_to_provider(true);
							})
						}
						
					}
				} catch(e) {
					log(e)
				}
			} else{
				vk_logged_out();
				log('vk mp3 prov faild (can not parse)')
			}



		  },
		  error: function(xhr){
			log('vk mp3 prov faild with jq error')
			vk_logged_out();
		  },
		  complete: function(xhr){
			swith_to_provider_finish();
		  }

		});
	} else{
		log('vk mp3 prov faild cos not auth')
		vk_logged_out();
		swith_to_provider_finish();
	}
	
}	
