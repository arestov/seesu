var get_text_form = function(text, uniq){
	var r = text.match(new RegExp('(?:<form.*?)' + uniq + '(?:.*)([\\s\\S]*?)<\\/form>'));
	return r && r[0];
};
var get_form_params = function(text, uniq){
	var text_of_form = get_text_form(text, uniq);
	if (text_of_form){
		var form_params = $(text_of_form).serializeArray();
		var _o = {};
		
		for (var i=0; i < form_params.length; i++) {
			_o[form_params[i].name] = form_params[i].value;
		}
		return _o;
	} else{
		return text_of_form
	}
	
	
};
var login_spec_vkapi = function(email, pass){
	$.ajax({
		dataType:'text',
		url: 'http://vk.com/login.php?layout=iphone&app=8&url=%2F%3Fact%3Dauth',
		type: 'get',
		success: function(r){
			var _o = get_form_params(r, 'real_login');
			_o.email = email;
			_o.pass = pass;
	
			$.ajax({
				dataType:'text',
				url:'http://login.vk.com/',
				type:'post',
				data:_o,
				success: function(r){
					koper = r;
					var _lo = get_form_params(r, 'http\\:\\/\\/vk\\.com\\/login\\.php');
					if (_lo){
						$.ajax({
							dataType: 'text',
							url: 'http://vk.com/login.php',
							type: 'post',
							data: _lo,
							success: function(r){
								var auth = r.match(/\((.*)\)/);
								auth = auth && auth[1];
								if (auth){
									var vk_s = JSON.parse(auth);
									auth_to_vkapi(vk_s);
									console.log(vk_s)
									
								} else{
									console.log('no auth')
								}
							}
						});
					} else{
						var auth = r.match(/\((.*)\)/);
						auth = auth && auth[1];
						if (auth){
							var vk_sarr = replace(/'|"/gi, '').split(/,/);
							var vk_s = {
								mid:vk_sarr[0],
								sid:vk_sarr[1],
								secret:vk_sarr[2],
								expire:vk_sarr[3],
							};
							auth_to_vkapi(vk_s);
							console.log('auth: ' + auth);
						} else{
							console.log('no auth')
						}
						
						
					}
					
					
				}
			});
		}
	});
}
