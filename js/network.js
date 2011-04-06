
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
var clear_vk_quene = new funcs_queue(15000);

function try_clear_api(callback, do_not_repeat){
	
	clear_vk_quene.add(function(){
		var sm = $('#slider-materail');
		var remove_iframe_ru = function(e){
			setTimeout(function(){
				$(e.target).remove();
				console.log('removed ru!');
				
				
				
				var remove_iframe_com = function(e){
					setTimeout(function(){
						$(e.target).remove();
						console.log('removed ru!');
					},5000)
				
				}
				
				var tvk_com = $('<iframe id="test_vk_auth_com" class="serv-container" src="http://vk.com/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html"></iframe>')
				.bind('load',remove_iframe_com);
				sm.append(tvk_com);
			},5000)
			
			
			
		}
		
		var tvk_ru =  $('<iframe id="test_vk_auth_ru" class="serv-container" src="http://vkontakte.ru/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html"></iframe>')
			.bind('load',remove_iframe_ru);
		
		sm.append(tvk_ru);
	});
	
	
	
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
	
	
	if (su.env.vkontakte && _u.api_id && _u.viewer_id && _u.sid && _u.secret){
		su.vk_app_mode = true;
		console.log('ginsa?')
		var stable_vk_api = auth_to_vkapi({
			secret: _u.secret,
			sid: _u.sid,
			mid:  _u.viewer_id
		}, false, _u.api_id, false, false, function(){
			if (callback){callback();}
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
		try_clear_api(callback, do_not_repeat);
		
		
		
		
	}
	
	
	
	
};

function try_mp3_providers(){
	if (seesu.env.cross_domain_allowed){
		try_hapi();
	} else{
		console.log('heyayy!')
		addEvent(window, "storage", function(e){
			if (e && e.key && e.key == 'fresh_vk_session' && e.newValue){
				clear_vk_quene.reset();
				set_vk_auth(e.newValue, true);
				seesu.track_event('Auth to vk', 'auth', 'from iframe post message');
				localStorage.removeItem('fresh_vk_session');
			}
		});
		try_api();
		
		
		return
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
