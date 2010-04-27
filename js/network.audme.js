audme_search = function(query, callback, error, nocache, after_ajax){

	var use_cache = !nocache;
	var hash = hex_md5(query);
	if (use_cache){
		var cache_used = cache_ajax.get('audme', hash, callback)
		if (cache_used) {return true;}
	}

	if (seesu.delayed_search.waiting_for_mp3provider){
		return false;
	}


	seesu.mp3_quene.add(function(){
		$.ajax({
		  timeout: 10000,
		  url: "http://audme.ru/search/",
		  global: false,
		  type: "GET",
		  data: {
		  	"filter": "1",
		  	"isall": "0",
		  	"q": query,
		  	"p":1
		  },
		  dataType: "text",
		  beforeSend: seesu.vk.set_xhr_headers,
		  complete: function(xhr){
			var text = xhr.responseText;
			if (text.match(/^\{/) && text.match(/\}$/)){
				try {
					var _r = JSON.parse(text);
					var r_div = document.createElement('div');
					r_div.innerHTML = _r;


					var music_list = [];

					var r = $('.playBox',r_div);
					if (r && r.length) {
						
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
					} 
				
					if (music_list && music_list.length && callback) {
						cache_ajax.set('audme', hash, music_list);
						callback(music_list);
					} else{
						if  (error) {error(xhr);}
					}
				} catch(e) {
					log(e)
					if  (error) {error(xhr);}
				}
			} else{
				if  (error) {error(xhr);}
			
			}
		  }
		});
		if (after_ajax) {after_ajax();}
	});
	return true;
}
