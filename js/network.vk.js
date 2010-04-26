var check_vk_logout_response = function(text){
	if (text.match("location.href='http://vkontakte.ru/login.php?op=logout'")){
		
		vk_logged_out();
	}
}
get_all_tracks = function(tracknode, playlist_nodes_for, was_unsuccessful){
	if (seesu.mp3_quene) {seesu.mp3_quene.reset();}
	seesu.delayed_search.tracks_waiting_for_search = 0;
	art_tracks_w_counter.text('');
	var used_successful = seesu.delayed_search.use.search_many_tracks(trackname, callback, function(){callback();}, was_unsuccessful);
	return used_successful;
}
get_track = function(tracknode, playlist_nodes_for, was_unsuccessful){
	art_tracks_w_counter.text((seesu.delayed_search.tracks_waiting_for_search += 1) || '');
	var used_successful = seesu.delayed_search.use.search_one_track(
		tracknode.data('artist_name') + ' - ' + tracknode.data('track_title'), 
		function(music_list){
			//success
			tracknode.removeClass('search-mp3');
			var best_track = search_from_list_one_track(music_list,tracknode.data('artist_name'),tracknode.data('track_title'));
			make_node_playable(tracknode, best_track.link, playlist_nodes_for, best_track.duration);
			resort_playlist(playlist_nodes_for);
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

var get_all_vk_api_tracks = function(trackname, callback){
	if (seesu.mp3_quene) {seesu.mp3_quene.reset();}
	seesu.delayed_search.tracks_waiting_for_search = 0;
	art_tracks_w_counter.text('');
	var used_successful = seesu.vk_api.audio_search(trackname, callback, function(){callback();}, was_unsuccessful);
	return used_successful;
}
var hardcore_vk_search = function(query, callback, error, nocache, after_ajax){

	var use_cache = !nocache;
	var hash = hex_md5(query);
	if (use_cache){
		var cache_used = cache_ajax.get('vk_h', hash, callback)
		if (cache_used) {return true;}
	}

	if (seesu.delayed_search.waiting_for_mp3provider){
		return false;
	}


	seesu.mp3_quene.add(function(){
		$.ajax({
		  timeout: 10000,
		  url: "http://vkontakte.ru/gsearch.php",
		  global: false,
		  type: "POST",
		  data: ({'c[section]' : 'audio', 'c[q]' : query}),
		  dataType: "text",
		  beforeSend: seesu.vk.set_xhr_headers,
		  complete: function(xhr){
			var text = xhr.responseText;
			if (text.match(/^\{/) && text.match(/\}$/)){
				try {
					var r = JSON.parse(text);
					log('Квантакте говорит: \n' + r.summary);
					var music_list = get_vk_music_list(r);
				
					if (music_list && callback) {
						cache_ajax.set('vk_h', hash, music_list);
						callback(music_list);
					} else{
						if  (error) {error(xhr);}
					}
				} catch(e) {
					log(e)
					if  (error) {error(xhr);}
				}
			} else{
				check_vk_logout_response(text);
				if  (error) {error(xhr);}
			
			}
		  }
		});
		if (after_ajax) {after_ajax();}
	});
	return true;


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
has_music_copy = function(array, entity, from_position){
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



