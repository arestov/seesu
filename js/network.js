
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


function try_api(callback, do_not_repeat){
	var try_saved_auth = function(){
		var vk_session_stored = w_storage('vk_session'+1915003);
		if (vk_session_stored){
			set_vk_auth(vk_session_stored);
			seesu.track_event('Auth to vk', 'auth', 'from saved');
		}
	};
	
	
	var _u = su._url;
	
	
	if (_u.api_id && _u.viewer_id && _u.sid && _u.secret){
		
		
		auth_to_vkapi({
			secret: _u.secret,
			sid: _u.sid,
			mid:  _u.viewer_id,
			
		}, false, _u.api_id, false, false, function(){
			if (callback){callback();}
			if (_u.api_settings & 8){
				
			} else{
				
			}
		});
		
		
		

		
		if (window != window.parent){
			su.vk_app_mode = true;
			console.log('ginsa?')
			var _s = document.createElement('script');
			_s.src='http://vk.com/js/api/xd_connection.js';
			_s.onload = function(){
				if (window.VK){
					VK.init(function(){});
					VK.addCallback('onSettingsChanged', function(sts){
						if (sts & 8){
							
							
							
						} else{
							
						}
					});
				}
				
			};
			document.documentElement.firstChild.appendChild(_s);
		}	else{
			console.log('hinsa :(((')
		}			
						
		
		
		
	} else{
		if (!do_not_repeat){
			var sm = $('#slider-materail');
			var remove_iframe_ru = function(e){
				setTimeout(function(){
					$(e.target).remove();
					console.log('removed ru!');
				},5000)
				
				
				var remove_iframe_com = function(e){
					setTimeout(function(){
						$(e.target).remove();
						console.log('removed ru!');
					},5000)
				
				}
				
				var tvk_com = $('<iframe id="test_vk_auth_com" class="serv-container" src="http://vk.com/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html"></iframe>')
				.bind('load',remove_iframe_com);
				sm.append(tvk_com);
			}
			
			var tvk_ru =  $('<iframe id="test_vk_auth_ru" class="serv-container" src="http://vkontakte.ru/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html"></iframe>')
				.bind('load',remove_iframe_ru);
			
			sm.append(tvk_ru)
		}
		
		
		
		
	}
	
	
	
	
};

function try_mp3_providers(){
	
	if (seesu.env.cross_domain_allowed){
		try_hapi();
	} else{
		console.log('heyayy!')
		addEvent(window, "message", function(e){
			if (e.origin == "http://seesu.me") {
				if (e.data.match(/^set_vk_auth\n/)){
					set_vk_auth(e.data.replace(/^set_vk_auth\n/, ''), true);
					seesu.track_event('Auth to vk', 'auth', 'from iframe post message');
				} else if (e.data == 'vkapi_auth_callback_ready'){
					e.source.postMessage('get_vk_auth', 'http://seesu.me');
				}
			} else {
				return false;
			}
		});
		try_api();

	}
  	
	
}	
