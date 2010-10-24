var vk_captcha;

var vk_login = function(login, pass, callback) {
	$.ajax({
	  url: "http://vkontakte.ru/login.php",
	  global: false,
	  type: "POST",
	  dataType: "json",
	  beforeSend: seesu.vk.set_xhr_headers,
	  data: {
		'noredirect': '1',
		'email': login,
		'pass': pass
	  },
	  error: function(){
		console.log('войти не удалось');
		console.log('plan A not worked, trying plan B')
		try_hard_vk_working(function(r){
			vk_logg_in(r.user.id, false, false, login, pass, callback) //function(id, email, sid, login, pass, callback){
		})
	  },
	  success: function(r){
		var vk_id,vk_error;
		if (vk_error = r.error){
			seesu.ui.els.vk_login_error.text('Wrong login or password')
		} else if (vk_captcha = r.captcha_sid){
			seesu.ui.els.captcha_img.attr('src','http://vkontakte.ru/captcha.php?s=1&sid=' + vk_captcha);
			dstates.add_state('body','vk-needs-captcha');
		} else 	if (vk_id = r.id) {
			vk_logg_in(vk_id, r.email, r.sid, login, pass, callback);
		}
	  },
	  complete: function(xhr){
	  	console.log(xhr.responseText)
	  }
	});	
}
var vk_send_captcha = function(captcha_key, login, pass, callback){
	$.ajax({
	  url: "http://vkontakte.ru/login.php",
	  global: false,
	  type: "POST",
	  dataType: "text",
	  beforeSend: seesu.vk.set_xhr_headers,
	  data: {
		'op': 'a_login_attempt',
		'captcha_key': captcha_key,
		'captcha_sid': vk_captcha
   	  },
	  success: function(text){
		if (text.match(/vklogin/)){
			vk_captcha = 0;
			vk_login(login, pass, callback);
		} else{
			try {
				var r = $.parseJSON(text)

			  	if (vk_captcha = r.captcha_sid){
			  		console.log(vk_captcha)
					seesu.ui.els.captcha_img.attr('src','http://vkontakte.ru/captcha.php?s=1&sid=' + vk_captcha);
					dstates.add_state('body','vk-needs-captcha');
				}
			} catch (e){
				console.log(e)
			}
		}

	  }
	});
}
var vk_logg_in = function(id, email, sid, login, pass, callback){
	if (id){
		w_storage('vkid', id, true);
	}
	if (email){
		w_storage('vkemail', email, true);
	}
	
	if (sid){
		w_storage( 'vk_sid', sid, true);
		seesu.vk.big_vk_cookie = 'remixchk=5; remixsid=' + sid;
		w_storage('big_vk_cookie', seesu.vk.big_vk_cookie, true);
	}
	
	
	
	seesu.vk_logged_in = true;
	seesu.delayed_search.switch_to_vk();
	dstates.remove_state('body','vk-needs-login');
	
	
	if (seesu.vk.save_pass){
		w_storage( 'vk_auth_login', login, true);
		w_storage( 'vk_auth_pass', pass, true);
	} else{
		w_storage( 'vk_auth_login', '', true);
		w_storage( 'vk_auth_pass', '', true);
	}
	console.log('hide vklogin form');
	if (callback) {callback();}
};
var vk_logged_out = function(force){
	var login = w_storage( 'vk_auth_login');
	var pass = w_storage( 'vk_auth_pass');
	if (force || !login || !pass){
		w_storage('vkid', '', true);
		w_storage('vkemail', '', true);
		w_storage('vk_sid', '', true);
		w_storage('big_vk_cookie', '', true);
		console.log('vk data has been removed')
	} else{
		console.log('vk data has NOT been  removed')
	}
	seesu.delayed_search.waiting_for_mp3provider = true;
	dstates.add_state('body','vk-needs-login');
	seesu.vk_logged_in = false;
	
	
};
