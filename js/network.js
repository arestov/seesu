
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
		var vk_t_raw  = suStore('vk_token_info');
		if (vk_t_raw){
			auth_to_vkapi(vk_t_raw, false, 2271620, tryVKOAuth);
		} else{
			//tryVKOAuth();
		}
		

		
	}
	
	
	
	
};
var seesu_vkappid = 2271620;

var connectApiToSeesu = function(vk_token, access, not_save) {
	var vkapi = new vkApi(vk_token, {queue: su.delayed_search.vk_api.queue});

	su.vk_api = vkapi;
	if (access){
		su.mp3_search.add(vkapi.asearch, true);
	}
	
	if (vk_token.expires_in){
		setTimeout(function() {
			vkapi.asearch.dead = vkapi.asearch.disabled = true;
			if (su.vk_api == vkapi){
				delete su.vkapi;
			}
		}, vk_token.expires_in)
	}
	if (!not_save){
		suStore('vk_token_info', cloneObj({}, vk_token, false, ['access_token', 'expires_in', 'user_id']), true);
	}

	vkapi.get('getProfiles', {
		uids: vk_token.user_id,
		fields: 'uid, first_name, last_name, domain, sex, city, country, timezone, photo, photo_medium, photo_big'
		
	},{nocache: true})
		.done(function(info) {
			info = info.response && info.response[0];
			if (info){
				seesu.vk.id = vk_token.user_id;

				var _d = cloneObj({data_source: 'vkontakte'}, info);
				su.vk.user_info = _d;
				
				
				
				if (!su.s.loggedIn()){
					su.s.getAuth(vk_token.user_id);
				} else{
					su.s.setInfo('vk', su.vk.user_info);
					su.s.api('user.update', su.vk.user_info);
				}
			} else {
				
			}
		})
		.fail(function(r) {
			
		})
};

function try_mp3_providers(){

	
	su.vk_auth = new vkAuth(seesu_vkappid, {
		bridge: 'http://seesu.me/vk/bridge.html',
		callbacker: 'http://seesu.me/vk/callbacker.html'
	}, ["friends", "video", "offline", "audio", "wall"]);


	var save_token = suStore('vk_token_info');
	if (save_token){
		//console.log('token!')
		connectApiToSeesu( new vkTokenAuth(seesu_vkappid, save_token), true);
		//console.log(save_token)
	}

	su.vk_auth
		.on('vk-token-receive', function(token){

			var vk_token = new vkTokenAuth(seesu_vkappid, token);			
			connectApiToSeesu(vk_token);
		})
		.on('want-open-url', function(wurl){
			if (app_env.showWebPage){
				app_env.showWebPage(wurl, function(url){
					var sb = 'http://seesu.me/vk/callbacker.html';
					if (url.indexOf(sb) == 0){
						app_env.hideWebPages();
						app_env.clearWebPageCookies();

						var hash = url.replace(sb, '');

						var hashurlparams = get_url_parameters(hash.replace(/^\#/,''));
						var access_token = hashurlparams.access_token;
						if (access_token){
							var at = {};
							at.access_token = access_token;
							if (hashurlparams.expires_in){
								at.expires_in = hashurlparams.expires_in;
							}
							at.user_id = hashurlparams.user_id;
							var vk_token = new vkTokenAuth(seesu_vkappid, at);
							connectApiToSeesu(vk_token);

						}
						return true;
						
					}
				}, function(e){
					app_env.openURL(wurl);
				}, 700, 600);
			} else{
				app_env.openURL(wurl);
			}
		});

	return 
	tryVKApi();
}	
