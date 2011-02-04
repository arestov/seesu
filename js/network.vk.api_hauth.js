var get_text_form = function(text, uniq){
	var r = text.match(new RegExp('(?:<form.*?)' + (uniq || '') + '(?:.*)([\\s\\S]*?)<\\/form>'));
	return r && r[0];
};
var get_form_params = function(text, uniq){
	var text_of_form = get_text_form(text, uniq);
	if (text_of_form){
		var _f = $(text_of_form);
		if (_f && _f[0]){
			form_params  = _f.serializeArray();
			var _o = {};
		
			for (var i=0; i < form_params.length; i++) {
				_o[form_params[i].name] = form_params[i].value;
			}
			return _o;
		} else{
			return false;
		}
		
		
	} else{
		return text_of_form
	}
	
	
};
var hauth_vks = function(mid, sid, secret, expire){
	return {
		mid: mid,
		sid: sid,
		secret: secret,
		expire: parseFloat(expire) || false
	};
};

var hauth_from_string = function(str){

	var vk_sarr = str.replace(/'|"|\s/gi, '').split(/,/);
	
	return hauth_vks.apply(this, vk_sarr);
};

var iapp_id = 8;
window.try_hapi = function(callback){
	//auth_to_vkapi;
	var try_cookies_hapi = function(){
		$.ajax({
		  url: "http://login.vk.com/",
		  global: false,
		  type: "post",
		  data:{
		  	app: iapp_id,
			from_host: 'vk.com',
			sid: '',
			url: '/?act=auth'
		  },
		  dataType: 'text',
		  success: function(r){
		  	var _o = get_form_params(r, 'http\\:\\/\\/i\\.vk\\.com\\/\\?act\\=auth');
		 
		  	console.log(_o)
			if (_o){
				$.ajax({
				  url: "http://i.vk.com/?act=auth",
				  global: false,
				  type: "post",
				  data:_o,
				  dataType: 'text',
				  success:function(r){
				  	var auth = r.match(/\((.*)\)/);
					auth = auth && auth[1];
					console.log(auth)
					if (auth){
						var vk_s = hauth_from_string(auth);
						console.log(vk_s);
						auth_to_vkapi(vk_s, true, iapp_id, try_hapi);
						if (callback) {callback();}
					} else{
						t_saved();
					}
				  }
				});
			} else{
				t_saved();
			}
			
		  }
		});
	};
	
	var _vk_sess = JSON.parse(w_storage('vk_session'+iapp_id) || false);

	var t_saved = function(){
		var login = w_storage( 'vk_auth_login');
		var pass = w_storage( 'vk_auth_pass');
		if (login && pass){
			login_spec_vkapi(login, pass, callback);
		} else{
			seesu.delayed_search.waiting_for_mp3provider = true;
			dstates.add_state('body','vk-needs-login');
		}
	};
	if (_vk_sess){
		auth_to_vkapi(_vk_sess, true, iapp_id, try_hapi, function(error_type){

			try_cookies_hapi();
		});
	} else{
		try_cookies_hapi();
	}
	
	
	
};

var save_vk_login_pass = function(login, pass){
	if (!login && !pass){
		w_storage('vk_auth_login','',true);
		w_storage('vk_auth_pass','',true);
	} else if (login && pass){
		w_storage('vk_auth_login', login, true);
		w_storage('vk_auth_pass', pass, true);
	}
	
}

var uilogin_to_hapi = function(login, pass, captcha, save){
	var callback = function(){
		if (save){
			save_vk_login_pass(login, pass);
		} else{
			save_vk_login_pass();
		}
	};
	login_spec_vkapi(login, pass, callback, captcha);
}

var login_spec_vkapi = function(email, pass, callback, captcha){
	$.ajax({
		dataType:'text',
		url: 'http://vk.com/login.php?layout=iphone&app=' + iapp_id + '&url=%2F%3Fact%3Dauth',
		type: 'get',
		global: false,
		success: function(r){
			var _o = get_form_params(r, 'real_login');
			_o.email = email;
			_o.pass = pass;
	
			$.ajax({
				dataType:'text',
				url:'http://login.vk.com/',
				type:'post',
				data:_o,
				global: false,
				success: function(r){
					if (!~r.indexOf('onError')){
						var _lo = get_form_params(r, 'http\\:\\/\\/vk\\.com\\/login\\.php');
						if (_lo){
							$.ajax({
								dataType: 'text',
								url: 'http://vk.com/login.php',
								type: 'post',
								global: false,
								data: _lo,
								success: function(r){
									var auth = r.match(/\((.*)\)/);
									auth = auth && auth[1];
									if (auth){
										var vk_s = JSON.parse(auth);
										auth_to_vkapi(vk_s, true, iapp_id, try_hapi);
										console.log(vk_s);
										if (callback) {callback();}
										
									} else{
										console.log('no auth')
									}
								}
							});
						} else{
							var auth = r.match(/\((.*)\)/);
							auth = auth && auth[1];
							if (auth){
								var vk_s = hauth_from_string(auth);
								
								auth_to_vkapi(vk_s, true, iapp_id, try_hapi);
								if (callback) {callback();}
								console.log('auth: ' + auth);
							} else{
								console.log('no auth');
							}
							
							
						}
					} else{
						seesu.ui.els.vk_login_error.text('Wrong login or password');
					}
					
					
					
				}
			});
		}
	});
}
