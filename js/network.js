var delay_vk_track_search = function(tracknode,playlist_nodes_for,reset_queue,delaying_func,delay) {

	var now = (new Date()).getTime(),
		timeout;
	
	if (reset_queue) {
		if (seesu.delayed_search.queue && seesu.delayed_search.queue.length) {
			
			//if we are loading new playlist than we don't need old queue
			for (var i = seesu.delayed_search.queue.length -1; i >= 0; i--) { //removing queue in reverse order
				if (!seesu.delayed_search.queue[i].done) {
					clearTimeout(seesu.delayed_search.queue[i].queue_item);
					seesu.delayed_search.call_at -= seesu.delayed_search.queue[i].timeout;
					art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
				}
			}
		}
		seesu.delayed_search.queue = [];
	}
	seesu.delayed_search.queue = seesu.delayed_search.queue || [];
	
	
	art_tracks_w_counter.text(seesu.delayed_search.tracks_waiting_for_search = (seesu.delayed_search.tracks_waiting_for_search + 1) || 1);
	
	seesu.delayed_search.call_at = seesu.delayed_search.call_at || now;
	if ( seesu.delayed_search.call_at && (seesu.delayed_search.call_at > now)) {
		timeout = seesu.delayed_search.call_at - now;
	} else {
		timeout = 0;
		seesu.delayed_search.call_at = now;
	}
	
	var queue_element = {'timeout': timeout };
	var delayed_ajax = function(queue_element,timeout) {
		 queue_element.queue_item = setTimeout(function(){
		 	seesu.search_one_track(tracknode,playlist_nodes_for,false,queue_element);
		 },timeout);
		
	}
	delayed_ajax(queue_element,timeout);
	seesu.delayed_search.queue.push(queue_element);
	var interval_for_big_delay = seesu.delayed_search.big_delay_interval.use;
	var big_delay = seesu.delayed_search.delay.use;
	var small_delay = seesu.delayed_search.delay_mini.use;
	seesu.delayed_search.call_at +=  (((seesu.delayed_search.tracks_waiting_for_search % interval_for_big_delay) == 0) ? big_delay : small_delay);

	
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
			art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
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
				log(best_track.artist + ' ' + best_track.track)
				log(music_list)
				make_node_playable(tracknode, best_track.link, playlist_nodes_for, best_track.duration);
				resort_playlist(playlist_nodes_for);
			}
			
			
			
			if (music_list) {
				
			} else {
				tracknode.attr('class' , 'search-mp3-failed');
			}
			art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		  },
		  complete: function(xhr){
		  	//log(xhr.responseText)
		  }
		});

	

	queue_element.done = true;
}
var get_all_audme_tracks = function(trackname,callback){
	$.ajax({
	  url: 'http://audme.ru/search/',
	  global: false,
	  type: "GET",
	  dataType: "HTML",
	  data: {
	  	"filter": "1",
	  	"isall": "0",
	  	"q": trackname,
	  	"p":1
	  },
	  timeout: 20000,
	  error: function(xhr){
	  	callback()
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
			if (callback) {callback(music_list);}
		}
		
		
		
		if (music_list) {
			
		} else {
			callback()
		}
	  },
	  complete: function(xhr){
	  	//log(xhr.responseText)
	  }
	});
}