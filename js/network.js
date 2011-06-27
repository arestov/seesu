
var get_youtube = function(q, callback){
	var cache_used = cache_ajax.get('youtube', q, callback);
	if (!cache_used){
		$.ajax({
			url: 'http://gdata.youtube.com/feeds/api/videos',
			dataType: 'jsonp',
			data: {
				q: q,
				v: 2,
				alt: 'json-in-script'
				
			},
			success: function(r){
				if (callback) {callback(r);}
					cache_ajax.set('youtube', q, r)
				} 
		})
	}
	
};

function tryVKOAuth (){
	var init_auth = vk_auth_box.requestAuth({not_open: true});
	if (init_auth.bridgekey){
		var i = document.createElement('iframe');	
		i.className = 'serv-container';
		i.src = init_auth.link;
		document.body.appendChild(i);
	}
};
function tryVKApi(){
	var _u = su._url;
	if (su.env.vkontakte){
		su.vk_app_mode = true;
		
		var stable_vk_api = auth_to_vkapi({
			user_id: _u.user_id,
			access_token: _u.access_token
		}, false, _u.api_id, false, false, function(){
			if ((_u.api_settings & 8)*1){
				stable_vk_api.asearch.disabled = false;
			} else{
				stable_vk_api.asearch.disabled = true;
			}
		});
		
		
		var _s = document.createElement('script');
		_s.src='http://vk.com/js/api/xd_connection.js';
		_s.onload = function(){
			if (window.VK){
				VK.init(function(){});
				VK.addCallback('onSettingsChanged', function(sts){
					if ((sts & 8)*1){
						if (!stable_vk_api.asearch.dead){
							stable_vk_api.asearch.disabled = false;
						}
						
					} else{
						stable_vk_api.asearch.disabled = true;
					}
				});
				documentScrollSizeChangeHandler = function(height){
					VK.callMethod("resizeWindow", 640, Math.max(580, height + 70));
				}
			}
			
		};
		document.documentElement.firstChild.appendChild(_s);
		
		
	} else{
		var vk_t_raw  = w_storage('vk_token_info');
		if (vk_t_raw){
			auth_to_vkapi(JSON.parse(vk_t_raw), false, 2271620, tryVKOAuth);
		} else{
			//tryVKOAuth();
		}
		

		
	}
	
	
	
	
};

function try_mp3_providers(){
	tryVKApi();
}	
