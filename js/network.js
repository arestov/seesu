



tryVKOAuth = function(){
	var init_auth = vk_auth_box.requestAuth({not_open: true});
	if (init_auth.bridgekey){
		var i = window.document.createElement('iframe');
		i.className = 'serv-container';
		i.src = init_auth.link;
		window.document.body.appendChild(i);
	}
};
var checkDeadSavedToken = function(vk_token) {
	var saved = suStore('vk_token_info');
	if (saved && saved.access_token == vk_token) {
		suStore("vk_token_info", "", true);
	}
};


var appendVKSiteApi = function(app_id) {
	yepnope({
		load: 'http://vk.com/js/api/openapi.js',
		complete: function() {
			VK.init({
				apiId: app_id
			}, function(){

			});
			setTimeout(function() {
				su.trigger("vk-site-api");
			}, 500);
		}
	});
};
try_mp3_providers = function(){
	var _u = su._url;
	if (app_env.vkontakte){
		su.vk_app_mode = true;

		var
			vkt = new vkTokenAuth(_u.api_id, {
				user_id: _u.user_id,
				access_token: _u.access_token
			}),
			has_music_access = (_u.api_settings & 8) * 1,
			music_connected = has_music_access;


		var vkapi = su.connectVKApi(vkt, has_music_access, true);


		/*


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
		*/


		yepnope({
			load: 'http://vk.com/js/api/xd_connection.js',
			complete: function() {
				VK.init(function(){
					su.trigger("vk-site-api");
				});
				
				
			}
		});

		su.vk_auth.on('settings-change', function(sts) {
			if ((sts & 8)*1){
				if (!music_connected){
					music_connected = true;
					su.mp3_search.add(vkapi.asearch, true);
				}
			} else{
				if (music_connected){
					su.mp3_search.remove(vkapi.asearch, true);
				}
			}
		});
		
		
		
	} else {
	
		

		var save_token = suStore('vk_token_info');
		if (save_token){
			//console.log('token!')
			su.vk_auth.api = su.connectVKApi( new vkTokenAuth(su.vkappid, save_token), true);

			//console.log(save_token)
			if (app_env.web_app){
				appendVKSiteApi(su.vkappid);
			}
			su.vk_auth.trigger('full-ready', true);
			
		}

		su.vk_auth
			.on('vk-token-receive', function(token){
				var vk_token = new vkTokenAuth(su.vkappid, token);
				this.api = su.connectVKApi(vk_token, true);
				if (app_env.web_app){
					appendVKSiteApi(su.vkappid);
				}
				
				this.trigger('full-ready', true);
			})
			.on('want-open-url', function(wurl){
				if (app_env.showWebPage){
					app_env.openURL(wurl);
					/*
					var opend = app_env.showWebPage(wurl, function(url){
						var sb = 'http://seesu.me/vk/callbacker.html';
						if (url.indexOf(sb) == 0){
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
								var vk_token = new vkTokenAuth(su.vkappid, at);
								su.connectVKApi(vk_token, true);

							}
							return true;
							
						}
					}, function(e){
						app_env.openURL(wurl);
					}, 700, 600);
					if (!opend){
						app_env.openURL(wurl);
					}
					*/
				} else{
					app_env.openURL(wurl);
				}
				su.updateState('wait-vk-login', true);
				seesu.trackEvent('Auth to vk', 'start');
			});

	}
};

