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
var viewer_id 		= '198193';
var vk_ms_s 		= 'JLutLcTbZR';
var vk_ms_api_id 	= '1732516';
var vk_v 			= '2.0';
var vk_api_link 	= ' http://api.vkontakte.ru/api.php'
var vk_api = function(method,params,callback){
	if (method) {
		var pv_signature_list = [], // array of <param>+<value>
			params_full = params || {},
			apisig =  true; // yes, we need signature
		
		params_full.method 	= method;
		params_full.api_id 	= vk_ms_api_id;
		params_full.v		= vk_v;
	//	params_full.format 	= params_full.format || 'json';
		
		if(apisig) {
			for (var param in params_full) {
				pv_signature_list.push(param + '=' + encodeURIComponent(params_full[param]));
				
			}
			
			pv_signature_list.sort();
			
			var paramsstr = '';
			for (var i=0, l = pv_signature_list.length; i < l; i++) {
				paramsstr += pv_signature_list[i];
			};
			
			log(viewer_id + paramsstr + vk_ms_s)
			params_full.sig = hex_md5(viewer_id + paramsstr + vk_ms_s);
			log(params_full.sig)
		}
		
		$.ajax({
		  url: vk_api_link,
		  global: false,
		  type: "GET",
		  dataType: params_full.format || "XML",
		  data: params_full,
		  error: function(r){
		  },
		  success: function(r){
			if (callback) {callback(r);}
		  }
		});
	}
};