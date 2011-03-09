function soundcloud_search(query, callback, error, nocache, after_ajax, only_cache){
	var search_source = {name: 'soundcloud', key: 0};
	var sc_key = 'HNVCUV6apk9ANn8tLERpag';
	var use_cache = !nocache;
	if (use_cache){
		var cache_used = cache_ajax.get('soundcloud', query, function(r){callback(r,search_source);})
		if (cache_used) {return true;}
	}
	if (only_cache){
		return false;
	}
	
	
	
	
	return seesu.soundcloud_queue.add(function(){
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
				if  (error) {error(search_source);}
				
			},
			
			success:function(r,xhr){

				if (r && r.length){
					var music_list = [];
					for (var i=0; i < r.length; i++) {
						var search_string = r[i].title || r[i].description;
						if (search_string){
							var _ttl = search_string.split('-',2);
							var artist = (_ttl.length == 2) && _ttl[0];
							var track_title = (_ttl.length == 2) && (_ttl[1] && _ttl[1].replace(/^\s*|\s*$/,'') || '') || _ttl[0];
							
							var entity = {
								'artist'  	: HTMLDecode(artist),
								'track'		: HTMLDecode(track_title),
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
						callback(music_list, search_source);
					}
				} else {
					if  (error) {error(search_source);}
				}
				
			}
			  
		})
		if (after_ajax) {after_ajax();}
	}, true);
}
