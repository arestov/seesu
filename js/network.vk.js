var vk_captcha;

var vk_login = function(login,pass) {
	$.ajax({
	  url: "http://vkontakte.ru/login.php",
	  global: false,
	  type: "POST",
	  dataType: "json",
	  data: {
		'noredirect': '1',
		'email': login,
		'pass': pass
	  },
	  error: function(){
		log('войти не удалось');
	  },
	  success: function(r){
		var vk_id,vk_error;
		if (vk_error = r.error){
			vk_login_error.text('Wrong login or password')
		} else if (vk_captcha = r.captcha_sid){
			captcha_img.attr('src','http://vkontakte.ru/captcha.php?s=1&sid=' + vk_captcha);
			$(document.body).addClass('vk-needs-captcha');
		} else 	if (vk_id = r.id) {
			vk_logg_in(vk_id, r.email);
			wait_for_vklogin && wait_for_vklogin();
		}
	  },
	  complete: function(xhr){
	  	log(xhr.responseText)
	  }
	});	
}
var vk_send_captcha = function(captcha_key,login,pass){
	$.ajax({
	  url: "http://vkontakte.ru/login.php",
	  global: false,
	  type: "POST",
	  dataType: "json",
	  data: {
		'op': 'a_login_attempt',
		'captcha_key': captcha_key,
		'captcha_sid': vk_captcha
   	  },
	  success: function(r){
	  	if (vk_captcha = r.captcha_sid){
	  		log(vk_captcha)
			captcha_img.attr('src','http://vkontakte.ru/captcha.php?s=1&sid=' + vk_captcha);
			$(document.body).addClass('vk-needs-captcha');
		}
	  },
	  complete: function(xhr){
	  	log(xhr.responseText)
		if ((xhr.responseText.indexOf('vklogin') != -1)){
			vk_captcha = 0;
			vk_login(login,pass);
			
		}
	  }
	});
}
var vk_login_check = function(){
	$.ajax({
	  url: "http://vkontakte.ru/feed2.php",
	  global: false,
	  type: "GET",
	  dataType: "json",
	  error: function(){
		log('vignali!');
		vk_logged_out();
	  }
	});
};
var vk_logg_in = function(id,email){
	widget.setPreferenceForKey(id, 'vkid');
	widget.setPreferenceForKey(email, 'vkemail');
	vk_logged_in = true;
	$(document.body).addClass('vk-logged-in');
	log('вошли в контакте и скрыли форму логина');
};
var vk_logged_out = function(){
	widget.setPreferenceForKey(false, 'vkid');
	widget.setPreferenceForKey(false, 'vkemail');
	log(widget.preferenceForKey('vkid'))
	vk_logged_in = false;
	$(document.body).removeClass('vk-logged-in');
	log('отображаем форму логина где нужно');
	
};
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




//var viewer_id 		= seesu.vk_id;
var vk_api = function(viewer_id,s,api_id){
	this.viewer_id 	= viewer_id;
	this.s 			= s;
	this.api_id 	= api_id;
	this.api_link 	= 'http://api.vkontakte.ru/api.php';
	this.v 			= '2.0';
}

vk_api.prototype = {
	'use': function(method,params,callback){
	
		if (method) {
			var _this = this;
			var pv_signature_list = [], // array of <param>+<value>
				params_full = params || {},
				apisig =  true; // yes, we need signature
			
			params_full.method 	= method;
			params_full.api_id 	= this.api_id;
			params_full.v		= this.v;
			params_full.format 	= params_full.format || 'json';
			
			if(apisig) {
				for (var param in params_full) {
					pv_signature_list.push(param + '=' + params_full[param]);
					
				}
				
				pv_signature_list.sort();
				var paramsstr = '';
				for (var i=0, l = pv_signature_list.length; i < l; i++) {
					paramsstr += pv_signature_list[i];
				};
				
				params_full.sig = hex_md5(this.viewer_id + paramsstr + this.s);

			}
			
			$.ajax({
			  url: _this.api_link,
			  global: false,
			  type: "GET",
			  dataType: params_full.format || "XML",
			  data: params_full,
			  error: function(r){
			  },
			  success: function(r){
				if (callback) {callback(r);}
			  },
			  complete: function(xhr){
			  	log(xhr.responseText)
			  }
			});
		}
	},
	audio_search: function(query,params,callback){
		var params_u = params || {};
			params_u.q = query;
			params_u.count = params_u.count || 30;
		this.use('audio.search',params_u,callback)
	}
}