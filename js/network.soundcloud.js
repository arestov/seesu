window.soundcloud_search = function(query, callback, error, nocache, after_ajax, only_cache){
	var sc_key = 'HNVCUV6apk9ANn8tLERpag';
	var use_cache = !nocache;
	var hash = hex_md5(query);
	if (use_cache){
		var cache_used = cache_ajax.get('soundcloud', query, callback)
		if (cache_used) {return true;}
	}
	if (only_cache){
		return false;
	}
	return seesu.soundcloud_quene.add(function(){
		seesu.track_event('mp3 search', 'soundcloud search');
		$.ajax({
			timeout: 10000,
			url: "http://api.soundcloud.com/tracks.js",
			global: false,
			type: "GET",
			dataType: "jsonp",
			data: {
				consumer_key: sc_key,
				filter:'streamable,downloadable',
				q: query
			},
			error:function(xhr){
				if  (error) {error(xhr);}
				
			},
			
			success:function(r,xhr){

				if (r && r.length){
					var music_list = [];
					for (var i=0; i < r.length; i++) {
						var search_string = r[i].title || r[i].description;
						if (search_string){
							var _ttl = search_string.split(/\s*\-\s*/);
							var artist = _ttl[0];
							
							var _tr_str = '';
							if (_ttl[1]){
								if (_ttl.length > 2){
									_tr_str += (
										search_string
										.replace(artist,'')
										.replace(/\s*\-\s*/,'')
									);
								
								} else{
									_tr_str += _ttl[1];
								}
							}
							
							var track_title = _tr_str;
							
							var entity = {
								'artist'  	: artist,
								'track'		: track_title,
								'duration'	: Math.round(r[i].duration/1000),
								'link'		: (r[i].download_url || r[i].stream_url) + '?consumer_key=' + sc_key,
								'from': 	'soundcloud',
								'real_title': r[i].title,
								'page_link':  r[i].permalink_url,
								'description': r[i].description || false
								
							
							};
							if (!has_music_copy(music_list,entity)){
								music_list.push(entity)
							}
						}
						
					};
				}
				if (music_list){
					cache_ajax.set('soundcloud', query, music_list);
					if (callback ){
						callback(music_list);
					}
				} else {
					if  (error) {error(xhr);}
				}
				
			}
			  
		})
		if (after_ajax) {after_ajax();}
	}, true);
	
	
}
