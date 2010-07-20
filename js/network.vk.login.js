var vk_captcha;

var vk_login = function(login, pass, callback) {
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
			vk_logg_in(vk_id, r.email, r.sid, login, pass, callback);
			wait_for_vklogin && wait_for_vklogin();
		}
	  },
	  complete: function(xhr){
	  	log(xhr.responseText)
	  }
	});	
}
var vk_send_captcha = function(captcha_key, login, pass, callback){
	$.ajax({
	  url: "http://vkontakte.ru/login.php",
	  global: false,
	  type: "POST",
	  dataType: "text",
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
			  		log(vk_captcha)
					captcha_img.attr('src','http://vkontakte.ru/captcha.php?s=1&sid=' + vk_captcha);
					$(document.body).addClass('vk-needs-captcha');
				}
			} catch (e){
				log(e)
			}
		}

	  }
	});
}
var vk_logg_in = function(id, email, sid, login, pass, callback){
	w_storage('vkid', id);
	w_storage('vkemail', email);
	w_storage( 'vk_sid', sid);
	
	seesu.vk.big_vk_cookie = 'remixchk=5; remixsid=' + sid;
	w_storage('big_vk_cookie', seesu.vk.big_vk_cookie);
	if (seesu.vk_api) {
		seesu.vk_api.viewer_id = seesu.vk_id = id;
	}
	seesu.vk_logged_in = true;
	seesu.delayed_search.switch_to_vk();
	$(document.body).removeClass('vk-needs-login');
	
	if (vk_save_pass.attr('checked')){
		w_storage( 'vk_auth_login', login);
		w_storage( 'vk_auth_pass', pass);
	} else{
		w_storage( 'vk_auth_login', '');
		w_storage( 'vk_auth_pass', '');
	}
	log('hide vklogin form');
	if (callback) {callback();}
};
var vk_logged_out = function(){
	w_storage('vkid', '');
	w_storage('vkemail', '');
	w_storage('vk_sid', '');
	w_storage('big_vk_cookie', '');
	seesu.vk_logged_in = false;
	log('display vklogin form if need')
	
};
