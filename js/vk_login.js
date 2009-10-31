var loginxhr = new XMLHttpRequest ();
loginxhr.onreadystatechange = function(){
  if (this.readyState == 4) {
	log(loginxhr.responseText);
	if ((loginxhr.responseText.indexOf('id') != -1) && 
		(loginxhr.responseText.indexOf('email') != -1) && 
		(loginxhr.responseText.indexOf('sid') != -1) && 
		(loginxhr.responseText.indexOf('pass') != -1)  ) {
		var r = JSON.parse(loginxhr.responseText);
		if (r.id) {
			log(vk_logged_in);
			vk_logg_in(r.id, r.email);
			wait_for_vklogin && wait_for_vklogin();
		}	
	} else {log('не получается войти');}
  }
};
loginxhr.open('POST', 'http://vkontakte.ru/login.php');
loginxhr.xhrparams = 'noredirect=1';
loginxhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
loginxhr.setRequestHeader("host", "vkontakte.ru");

var vk_login = function(login,pass) {
	loginxhr.send(loginxhr.xhrparams + '&email=' + encodeURIComponent(login) + '&pass=' + encodeURIComponent(pass));
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
	widget.setPreferenceForKey(null, 'vkid');
	widget.setPreferenceForKey(null, 'vkemail');
	vk_logged_in = false;
	$(document.body).removeClass('vk-logged-in');
	log('отображаем форму логина где нужно');
	
};