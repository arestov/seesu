
var get_vk_track = function(tracknode,playlist_nodes_for,delaying_func,queue_element){	
		
	if (vk_logged_in) {
		$.ajax({
		  url: "http://vkontakte.ru/gsearch.php",
		  global: false,
		  type: "POST",
		  data: ({'c[section]' : 'audio', 'c[q]' : tracknode.data('artist_name') + ' - ' + tracknode.data('track_title')}),
		  dataType: "json",
		  beforeSend: function(){
			tracknode.addClass('search-mp3');
		  },
		  error: function(xhr){
			tracknode.attr('class' , 'search-mp3-failed');
			art_tracks_w_counter.text((delaying_func.tracks_waiting_for_search -= 1) || '');
			
			log('Вконтакте молвит: ' + xhr.responseText);
			if (xhr.responseText.indexOf('Действие выполнено слишком быстро.') != -1){
				delaying_func.call_at += (1000*60*5);
			} else {
				vk_login_check();
			}
			
		  },
		  success: function(r){
			log('Квантакте говорит: ' + r.summary);
			var music_list = get_vk_music_list(r);
			if (music_list){
				make_node_playable(tracknode, music_list[0].link, playlist_nodes_for, music_list[0].duration)
				resort_playlist(playlist_nodes_for);
			} else {
				tracknode.attr('class' , 'search-mp3-failed');
			}
			art_tracks_w_counter.text((delaying_func.tracks_waiting_for_search -= 1) || '');
		  }
		});
	} else {
		art_tracks_w_counter.text((delaying_func.tracks_waiting_for_search -= 1) || '');
	}
	queue_element.done = true;
}
var delay_vk_track_search = function(tracknode,playlist_nodes_for,reset_queue,delaying_func) {
	if (!vk_logged_in) {
		return false;
	} else {
		var now = (new Date()).getTime(),
			timeout;
		var delaying_func;
		
		if (reset_queue) {
			if (delaying_func.queue && delaying_func.queue.length) {
				
				//if we are loading new playlist than we don't need old queue
				for (var i = delaying_func.queue.length -1; i >= 0; i--) { //removing queue in reverse order
					if (!delaying_func.queue[i].done) {
						clearTimeout(delaying_func.queue[i].queue_item);
						delaying_func.call_at -= delaying_func.queue[i].timeout;
						art_tracks_w_counter.text((delaying_func.tracks_waiting_for_search -= 1) || '');
					}
				}
			}
			delaying_func.queue = [];
		}
		delaying_func.queue = delaying_func.queue || [];
		
		
		art_tracks_w_counter.text(delaying_func.tracks_waiting_for_search = (delaying_func.tracks_waiting_for_search + 1) || 1);
		
		delaying_func.call_at = delaying_func.call_at || now;
		if ( delaying_func.call_at && (delaying_func.call_at > now)) {
			timeout = delaying_func.call_at - now;
		} else {
			timeout = 0;
			delaying_func.call_at = now;
		}
		
		var queue_element = {'timeout': timeout };
		var delayed_ajax = function(queue_element,timeout) {
			 queue_element.queue_item = setTimeout(function(){
			 	delaying_func(tracknode,playlist_nodes_for,delaying_func,queue_element);
			 },timeout);
			
		}
		delayed_ajax(queue_element,timeout);
		delaying_func.queue.push(queue_element);
		delaying_func.call_at += ((delaying_func.tracks_waiting_for_search % 8) == 0) ? 5000 : 1000;
	}
	
	
	return false;
};
var get_vk_music_list = function (r) {// vk_music_list is empty array, declared before cicle
	if (!r.rows.match(/noResultsWhite/)) {
		var row_nodes  = $('<div></div>').html(r.rows).find('.audioRow');
		var vk_music_list = [];
		for (var i=0, l = row_nodes.length; i < l; i++) {
			var row = row_nodes[i],
				text = $('.audioText', row)[0],
				artist = $('b', text)[0].textContent,
				track = $('span', text)[0].textContent,
				playStr = $('img.playimg', row )[0].getAttribute('onclick'),
				vk_music_obj = parseStrToObj(playStr);
			vk_music_obj.artist = artist;
			vk_music_obj.track = track;
		
			vk_music_list.push(vk_music_obj);
		}
		return vk_music_list;
	} else {return false}
}


var getMusic = function(trackname){
	if (!vk_logged_in) {
		wait_for_vklogin = function(){getMusic(trackname)}
		return false;
	} else {
		$.ajax({
		  url: "http://vkontakte.ru/gsearch.php",
		  global: false,
		  type: "POST",
		  data: ({'c[section]' : 'audio', 'c[q]' : trackname}),
		  dataType: "json",
		  error: function(xhr){
			
			log('Вконтакте молвит: ' + xhr.responseText);
			if (xhr.responseText.indexOf('Действие выполнено слишком быстро.') != -1){
				
			} else {
				vk_login_check();
			}
			
		  },
		  success: function(r){
			log('Квантакте говорит: ' + r.summary);
			var music_list = get_vk_music_list(r);
			if (music_list) {
				render_playlist(music_list, artsTracks);
			} else{
				log('Поиск не удался... :’—(');
			}
			
		  }
		});
	}
};