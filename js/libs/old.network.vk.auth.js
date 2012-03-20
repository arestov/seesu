var vk_auth_box = {
	setUI: function(vk_login_ui){
		this.vk_login_ui = vk_login_ui;
		
		if (this.load_indicator){
			this.vk_login_ui.showLoadIndicator();
		}
		
		/*			if (this.vk_login_ui){
					_this.vk_login_ui.hideLoadIndicator();
				this.vk_login_ui.showLoadIndicator();
				
			}*/
	},
	startIndicating: function(){
		this.load_indicator = true;
		if (this.vk_login_ui){
			this.vk_login_ui.showLoadIndicator();
		}
	},
	stopIndicating: function(){
		this.load_indicator = false;
		if (this.vk_login_ui){
			this.vk_login_ui.hideLoadIndicator();
		}
	},
	requestAuth: function(p ){
		
		return this.authInit(p || {});
		
	},
	createAuthFrame: function(first_key){
		if (this.auth_inited){
			return false;
		}
		var i = this.auth_frame = document.createElement('iframe');	
		addEvent(window, 'message', function(e){
			if (e.data == 'vk_bridge_ready:'){
				console.log('vk_bridge_ready')
				e.source.postMessage("add_keys:" + first_key, '*');
			} else if(e.data.indexOf('vk_token:') === 0){
				vkTokenAuth(e.data.replace('vk_token:',''));
				console.log('got vk_token!!!!')
				console.log(e.data.replace('vk_token:',''));
				seesu.track_event('Auth to vk', 'end');
			} else if (e.data == 'vk_error:'){
				
			}
		});
		i.className = 'serv-container';
		i.src = 'http://seesu.me/vk/bridge.html';
		document.body.appendChild(i);
		this.auth_inited = true;
	},
	getInitAuthData: function(p){
		var ru = p && p.ru;
		
		var o = {};//http://api.vkontakte.ru/oauth/authorize?client_id=2271620&scope=friends,video,offline,audio,wall&redirect_uri=http://seesu.me/vk/tr?t=14234&display=page&response_type=token
		o.link = 'http://api.' + (ru ? "vkontakte.ru" :  'vk.com') + '/oauth/authorize?client_id=2271620&scope=friends,video,offline,audio,wall&display=page&response_type=token';
		var link_tag = 'http://seesu.me/vk/callbacker.html';
		
		if (!su.env.deep_sanbdox){
			o.bridgekey = hex_md5(Math.random() + 'bridgekey'+ Math.random());
			link_tag += '?key=' + o.bridgekey;
		}
		
		
		
		o.link += '&redirect_uri=' + encodeURIComponent(link_tag);
		
		return o;
		/*
		var vkdomain = class_name.match(/sign-in-to-vk-ru/) ? 'vkontakte.ru' : 'vk.com';
		if (su.vk_app_mode){
			if (window.VK){
				VK.callMethod('showSettingsBox', 8);
			}
		} else{
			window.open('http://' + vkdomain + '/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html');
			
		}
		*/
	},
	setAuthBridgeKey: function(key){
		if (!this.auth_inited){
			this.createAuthFrame(key)
		} else{
			this.auth_frame.contentWindow.postMessage("add_keys:" + key, '*');
		}
	},
	authInit: function(p){
		var _this = this;
		
		//init_auth_data.bridgekey	
		
		var not_external = !!app_env.showWebPage;
		
		var init_auth_data = this.getInitAuthData(p);
		if (init_auth_data.bridgekey || !p.c){
			this.setAuthBridgeKey(init_auth_data.bridgekey);
		}  else if (p.c && !not_external){
			p.c.finishing();
		}
		if (!p.not_open){
			if (app_env.showWebPage){
				app_env.showWebPage(init_auth_data.link, function(url){
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
							vkTokenAuth(at);
						}
						
						
						return true;
						
					}
				}, function(e){
					app_env.openURL(init_auth_data.link);
				}, 700, 600);
			} else{
				app_env.openURL(init_auth_data.link);
			}
			
		} else{
			this.startIndicating();
			setTimeout(function(){
				_this.stopIndicating();
			},10000)
			
			

			
		}
		
		seesu.track_event('Auth to vk', 'start');
		
		//dstates.add_state('body','vk-waiting-for-finish');
		
		
		return init_auth_data
		
	}
};
