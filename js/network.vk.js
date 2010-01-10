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
var get_vk_track = function(tracknode,playlist_nodes_for,reset_queue) {
	if (!vk_logged_in) {
		return false;
	} else {
		var now = (new Date()).getTime(),
			timeout;
		var this_func = arguments.callee;
		
		if (reset_queue) {
			if (this_func.queue && this_func.queue.length) {
				
				//if we are loading new playlist than we don't need old queue
				for (var i = this_func.queue.length -1; i >= 0; i--) { //removing queue in reverse order
					if (!this_func.queue[i].done) {
						clearTimeout(this_func.queue[i].queue_item);
						this_func.call_at -= this_func.queue[i].timeout;
						art_tracks_w_counter.text((this_func.tracks_waiting_for_search -= 1) || '');
					}
				}
			}
			this_func.queue = [];
		}
		this_func.queue = this_func.queue || [];
		
		
		art_tracks_w_counter.text(this_func.tracks_waiting_for_search = (this_func.tracks_waiting_for_search + 1) || 1);
		
		this_func.call_at = this_func.call_at || now;
		if ( this_func.call_at && (this_func.call_at > now)) {
			timeout = this_func.call_at - now;
		} else {
			timeout = 0;
			this_func.call_at = now;
		}
		
		var queue_element = {'timeout': timeout };
		var delayed_ajax = function(queue_element,timeout) {
			 queue_element.queue_item = setTimeout(function(){
				
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
					  error: function(r){
						tracknode.attr('class' , 'search-mp3-failed');
						art_tracks_w_counter.text((this_func.tracks_waiting_for_search -= 1) || '');
						
						log('Вконтакте молвит: ' + r.responseText);
						if (r.responseText.indexOf('Действие выполнено слишком быстро.') != -1){
							this_func.call_at += (1000*60*5);
						} else {
							vk_login_check();
						}
						
					  },
					  success: function(r){
						log('Квантакте говорит: ' + r.summary);
						var srd = document.createElement('div');
							srd.innerHTML = r.rows;
						var rows = $(".audioRow ", srd);
						if (rows.length) {
							var ms = get_vk_music_list(rows);
							make_node_playable(tracknode, ms[0].link, playlist_nodes_for, ms[0].duration)
							resort_playlist(playlist_nodes_for);
						
						} else {
							tracknode.attr('class' , 'search-mp3-failed');
						}
						art_tracks_w_counter.text((this_func.tracks_waiting_for_search -= 1) || '');
					  }
					});
				} else {
					art_tracks_w_counter.text((this_func.tracks_waiting_for_search -= 1) || '');
				}
				queue_element.done = true;
			},timeout);
			
		}
		delayed_ajax(queue_element,timeout);
		this_func.queue.push(queue_element);
		this_func.call_at += ((this_func.tracks_waiting_for_search % 8) == 0) ? 5000 : 1000;
	}
	
	
	return false;
};
var get_vk_music_list = function (row_nodes) {// vk_music_list is empty array, declared before cicle
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
}


var getMusic = function(trackname){
	if (!vk_logged_in) {
		return false;
	} else {
		var xhr = new XMLHttpRequest ();

		xhr.onreadystatechange = function () {
		  if ( this.readyState == 4 ) {
			if (xhr.responseText.match(/rows/) && !xhr.responseText.match(/noResultsWhit/)) {
				var srd = document.createElement('div');
					srd.innerHTML = JSON.parse(xhr.responseText).rows;
				var rows = $(".audioRow ", srd);

				log(xhr.responseText)

				render_playlist(get_vk_music_list(rows), artsTracks);
			} else {
				log('Поиск не удался... :’—(');
				log(xhr.responseText);
				if ((xhr.responseText.indexOf('http://vkontakte.ru/login.php?op=logout') != -1) && xhr.responseText.indexOf('http://vkontakte.ru/images/progress.gif' != -1)) {
					vk_logged_out();
					log('квантакте изгнал вас из рая');
				}
			}
		  }
		};
		xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
		var param = 'c[section]=audio' + '&c[q]=' + encodeURIComponent(trackname);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.send(param);

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
		//	params_full.format 	= params_full.format || 'json';
			
			if(apisig) {
				for (var param in params_full) {
					pv_signature_list.push(param + '=' + params_full[param]);
					
				}
				
				pv_signature_list.sort();
				var paramsstr = '';
				for (var i=0, l = pv_signature_list.length; i < l; i++) {
					paramsstr += pv_signature_list[i];
				};
				
				log(this.viewer_id + paramsstr + this.s)
				params_full.sig = hex_md5(this.viewer_id + paramsstr + this.s);
				log(params_full.sig)
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
	}
}