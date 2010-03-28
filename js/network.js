var delay_vk_track_search = function(tracknode,playlist_nodes_for,reset_queue,delaying_func,delay) {
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
		delaying_func.call_at +=  (((delaying_func.tracks_waiting_for_search % 5) == 0) ? 5000 : 2500);
	}
	
	
	return false;
};

var get_audme_track = function(tracknode,playlist_nodes_for,delaying_func,queue_element){	

		tracknode.addClass('search-mp3');
		
		$.ajax({
		  url: 'http://audme.ru/search/',
		  global: false,
		  type: "GET",
		  dataType: "HTML",
		  data: {
		  	"filter": "1",
		  	"isall": "0",
		  	"q": tracknode.data('artist_name') + ' - ' + tracknode.data('track_title'),
		  	"p":1
		  },
		  timeout: 20000,
		  error: function(xhr){
		  	tracknode.attr('class' , 'search-mp3-failed');
			art_tracks_w_counter.text((delaying_func.tracks_waiting_for_search -= 1) || '');
		  },
		  success: function(_r){
			log('audme search')
			var r_div = document.createElement('div');
			r_div.innerHTML = _r;
			log(_r)
			var r = $('.playBox',r_div);
			if (r && r.length) {
				var music_list = [];
				for (var i=0, l = r.length; i < l; i++) {
					var entity = {
						'artist'  	:$(r[i]).find('.songTitle .artist').text(),
						'duration'	:r[i].getAttribute('dur'),
						'link'		:r[i].getAttribute('filepath'),
						'track'		:$(r[i]).find('.songTitle .title').text()
						
					};
					if (!has_music_copy(music_list,entity)){
						music_list.push(entity)
					}
					
					
				};
				var best_track = search_from_list_one_track(music_list,tracknode.data('artist_name'),tracknode.data('track_title'));
				make_node_playable(tracknode, best_track.link, playlist_nodes_for, best_track.duration);
				resort_playlist(playlist_nodes_for);
			}
			
			
			
			if (music_list) {
				
			} else {
				tracknode.attr('class' , 'search-mp3-failed');
			}
			art_tracks_w_counter.text((delaying_func.tracks_waiting_for_search -= 1) || '');
		  },
		  complete: function(xhr){
		  	//log(xhr.responseText)
		  }
		});

	

	queue_element.done = true;
}