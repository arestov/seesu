delay_track_search = function(tracknode,playlist_nodes_for,reset_queue,delaying_func,delay) {

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
		 	seesu.delayed_search.use.search_one_track(tracknode,playlist_nodes_for,false,queue_element);
		 },timeout);
		
	}
	delayed_ajax(queue_element,timeout);
	seesu.delayed_search.queue.push(queue_element);
	var interval_for_big_delay = seesu.delayed_search.use.big_delay_interval;
	var big_delay = seesu.delayed_search.use.delay_big;
	var small_delay = seesu.delayed_search.use.delay_mini;
	seesu.delayed_search.call_at +=  (((seesu.delayed_search.tracks_waiting_for_search % interval_for_big_delay) == 0) ? big_delay : small_delay);

	
};



try_mp3_providers = function(){
	var have_mp3_provider;
	var prov_count_down = 2;
	var mp3_prov_selected = widget.preferenceForKey('mp3-search-way');
	var provider_selected;
	var swith_to_provider = function(try_selected){
		if (provider_selected) {return false}
		if (mp3_prov_selected){
			if (seesu.delayed_search.available && seesu.delayed_search.available.length){
				
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
					}
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
	
	$.ajax({
	  url: "http://query.yahooapis.com/v1/public/yql?q=SELECT%20*%20FROM%20html%20WHERE%20url%3D'http%3A%2F%2Faudme.ru'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
	  success: function(r){

	  	if (!r.query.results){
	  		log(typeof r.query.results)
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
  
	$.ajax({
	  url: "http://vkontakte.ru/feed2.php",
	  global: false,
	  type: "GET",
	  dataType: "json",
	  timeout: 7000,
	  success: function(r){
		
		if (!r) {log(r);return false;}
	  	if (r.user && r.user.id) {
	  		
	  		zz.viewer_id = r.user.id;
			seesu.delayed_search.available.push('vk');
			seesu.vk_logged_in = true;
			log('vk mp3 prov ok')
			swith_to_provider(true)
		} else{
			vk_logged_out();
			log('vk mp3 prov faild')
		}
	  	
	  },
	  error: function(xhr){
		log('vk mp3 prov faild')
		vk_logged_out();
	  },
	  complete: function(xhr){
		prov_count_down--;
		if (prov_count_down == 0){
			swith_to_provider();
		}
	  }
	  
	});
}	