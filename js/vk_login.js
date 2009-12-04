var vk_captcha;

var vk_login = function(login,pass,captcha_key) {
	var data = {
	  'noredirect': '1',
	  'email': login,
	  'pass': pass
	};
	if (vk_captcha && captcha_key ){
	  data.captcha_sid = vk_captcha;
	  data.captcha_key = captcha_key;
	}
	$.ajax({
	  url: "http://vkontakte.ru/login.php",
	  global: false,
	  type: "POST",
	  dataType: "json",
	  data: data,
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
	  },
	  success: function(r){
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