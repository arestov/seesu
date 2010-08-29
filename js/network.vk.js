var check_vk_logout_response = function(text){
	if (text.match("location.href='http://vkontakte.ru/login.php?op=logout'")){
		
		vk_logged_out();
	}
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

	var qcheck = seesu.mp3_quene.big_quene;
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
						if (qcheck == seesu.mp3_quene.big_quene || seesu.mp3_quene.big_quene.length == 0 || seesu.mp3_quene.big_quene.length == 0){
							callback(music_list);
						}
						
					} else{
						if (qcheck == seesu.mp3_quene.big_quene || seesu.mp3_quene.big_quene.length == 0){
							if  (error) {error(xhr);}
						}
						
					}
				} catch(e) {
					log(e)
					if (qcheck == seesu.mp3_quene.big_quene || seesu.mp3_quene.big_quene.length == 0){
						if  (error) {error(xhr);}
					}
					
				}
			} else{
				check_vk_logout_response(text);
				
				if (qcheck == seesu.mp3_quene.big_quene || seesu.mp3_quene.big_quene.length == 0){
					if  (error) {error(xhr);}
				}
			
			}
		  }
		});
		if (after_ajax) {after_ajax();}
	});
	return true;


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



