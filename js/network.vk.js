
var get_vk_api_track = function(tracknode,playlist_nodes_for,delaying_func,queue_element){	

	tracknode.addClass('search-mp3');
	zz.audio_search(
		tracknode.data('artist_name') + ' - ' + tracknode.data('track_title'),
		false,
		function(r, resp_text){
			log('api search')
			if (r.response && (r.response.length > 1 )) {
				var music_list = [];
				for (var i=1, l = r.response.length; i < l; i++) {
					var entity = {
						'artist'  	:r.response[i].artist,
						'duration'	:r.response[i].duration,
						'link'		:r.response[i].url,
						'track'		:r.response[i].title
						
					};
					if (!has_music_copy(music_list,entity)){
						music_list.push(entity)
					}
					
					
				};
				var best_track = search_from_list_one_track(music_list,tracknode.data('artist_name'),tracknode.data('track_title'));
				make_node_playable(tracknode, best_track.link, playlist_nodes_for, best_track.duration);
				resort_playlist(playlist_nodes_for);
			} else{
				log(resp_text)
			}
			
			
			
			if (music_list) {
				
			} else {
				tracknode.attr('class' , 'search-mp3-failed');
			}
			art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		},
		function(xhr){
			tracknode.attr('class' , 'search-mp3-failed');
			art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		}
	);


	queue_element.done = true;
}
var get_vk_track = function(tracknode,playlist_nodes_for,delaying_func,queue_element){	
	tracknode.addClass('search-mp3');
	$.ajax({
	  timeout: 10000,
	  url: "http://vkontakte.ru/gsearch.php",
	  global: false,
	  type: "POST",
	  data: ({'c[section]' : 'audio', 'c[q]' : tracknode.data('artist_name') + ' - ' + tracknode.data('track_title')}),
	  dataType: "json",
	  beforeSend: function(xhr){
	  	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		tracknode.addClass('search-mp3');
	  },
	  error: function(xhr){
		tracknode.attr('class' , 'search-mp3-failed');
		art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
		
		log('Error, vk say: ' + xhr.responseText);
		if (xhr.responseText.indexOf('Действие выполнено слишком быстро.') != -1){
			delaying_func.call_at += (1000*60*5);
		}
		
	  },
	  success: function(r){
		log('success hardcore search, vk say: ' + r.summary);
		var music_list = get_vk_music_list(r);
		if (music_list){
			var best_track = search_from_list_one_track(music_list,tracknode.data('artist_name'),tracknode.data('track_title'));
			make_node_playable(tracknode, best_track.link, playlist_nodes_for, best_track.duration)
			resort_playlist(playlist_nodes_for);
		} else {
			tracknode.attr('class' , 'search-mp3-failed');
		}
		art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search -= 1) || '');
	  }
	});
	
	queue_element.done = true;
}

var de_html_entity = document.createElement('div');
var de_html = function(html_text){
	de_html_entity.innerHTML = html_text;
	return de_html_entity.textContent;
}
var search_from_list_one_track = function(array,artist,track){
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
var parseStrToObj = function(onclickstring){
	var b = onclickstring,
		fname = '';
	b = b.substring(b.indexOf('(') + 1, b.indexOf(')'));
	var params 		= b.split(','),
		server 		= params[1],
		user 		= params[2],
		duration 	= params[4];
	while (user.length < 5) {user = '0' + user;}
	fname = params[3];
	fname = fname.substring(1, fname.length - 1);
	var obj ={'sever': server, 'user' : user , 'filename' : fname, 'link' : ('http://cs' + server + '.vkontakte.ru/u' + user + '/audio/' + fname + '.mp3'), 'duration' : duration};
	return obj;

};
var get_vk_music_list = function (r) {// vk_music_list is empty array, declared before cicle
	if (!r.rows.match(/noResultsWhite/)) {
		var row_nodes  = $('<div></div>').html(r.rows).find('.audioRow');
		var vk_music_list = [];
		for (var i=0, l = row_nodes.length; i < l; i++) {
			var row = row_nodes[i],
				text = $('.audioTitle', row)[0],
				artist = $('b', text)[0].textContent,
				track = $('span', text)[1].textContent,
				playStr = $('img.playimg', row )[0].getAttribute('onclick'),
				vk_music_obj = parseStrToObj(playStr);
			vk_music_obj.artist = artist;
			vk_music_obj.track = track;
			
			if (!has_music_copy(vk_music_list,vk_music_obj)){
				vk_music_list.push(vk_music_obj);
			}
		}
		return vk_music_list;
	} else {return false}
}

var get_all_vk_api_tracks = function(trackname,callback){
	zz.audio_search(
		trackname,
		false,
		function(r, resp_text){
			log('api search')
			if (r.response && (r.response.length > 1 )) {
				var music_list = [];
				for (var i=1, l = r.response.length; i < l; i++) {
					var entity = {
						'artist'  	:r.response[i].artist,
						'duration'	:r.response[i].duration,
						'link'		:r.response[i].url,
						'track'		:r.response[i].title
						
					};
					if (!has_music_copy(music_list,entity)){
						music_list.push(entity)
					}
					
					
				};
				if (callback) {callback(music_list);}
			} else{
				if (callback) {callback()}
			}
		},
		function(){
			callback();
		}
	);
}
var get_all_vk_tracks = function(trackname,callback){

	$.ajax({
	  timeout: 10000,
	  url: "http://vkontakte.ru/gsearch.php",
	  global: false,
	  type: "POST",
	  data: ({'c[section]' : 'audio', 'c[q]' : trackname}),
	  dataType: "json",
	  beforeSend: function(xhr){
	  	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	  },
	  error: function(xhr){
		callback()
		log('Вконтакте молвит: ' + xhr.responseText);
		if (xhr.responseText.indexOf('Действие выполнено слишком быстро.') != -1){
			
		} 
		
	  },
	  success: function(r){
		log('Квантакте говорит: ' + r.summary);
		var music_list = get_vk_music_list(r);
		if (music_list) {
			callback(music_list);
		} else{
			log('Поиск не удался... :’—(');
			callback()
		}
		
	  }
	});
	
};