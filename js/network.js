
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





var dui = function() {
	//ui_samples.children('.vk-login-context'),
//this.oos.removeClass("waiting-vk-login");

	var _this = this;
	var nvk = this.o.clone();
	if (su.vk.wait_for_finish){
		nvk.addClass('vk-finishing');
	}	
	if (this.load_indicator){
		nvk.addClass("waiting-vk-login");
	}
	if (request_description){
		nvk.find('.login-request-desc').text(request_description);
	}
//	var auth_c =  nvk.find('.auth-container');
	nvk.find('.sign-in-to-vk').click(function(e){
		var class_name = this.className;
		var clicked_node = $(this);
		

		var vkdomain = class_name.match(/sign-in-to-vk-ru/) ? 'vkontakte.ru' : 'vk.com';
		if (su.vk_app_mode){
			if (window.VK){
				VK.callMethod('showSettingsBox', 8);
			}
		} else{
			
			su.vk_auth.requestAuth({
				ru: class_name.match(/sign-in-to-vk-ru/) ? true: false,
				c: _this
			})
		
		}
		e.preventDefault();
	});

	_this.oos =  _this.oos.add(nvk);
	return nvk;
};
/*
if (su.vk_app_mode){
	if (window.VK){
		VK.callMethod('showSettingsBox', 8);
	}
} else{
	
	su.vk_auth.requestAuth({
		ru: class_name.match(/sign-in-to-vk-ru/) ? true: false,
		c: _this
	})

}
*/

var vkLoginUI = function(md) {
	this.init();
	this.md = md;
	this.createBase();
	this.setModel(md);
};

servView.extendTo(vkLoginUI, {
	state_change: {
		wait: function(state) {
			if (state){
				this.c.addClass("waiting-vk-login");
			} else {
				this.c.removeClass("waiting-vk-login");
			}
		},
		"request-description": function(state) {
			this.c.find('.login-request-desc').text(state || "");
		}
	},
	createBase: function() {
		this.c = su.ui.samples.vklc.clone();
		var _this = this;
		this.c.find('.sign-in-to-vk').click(function(e){
			_this.md.requestAuth();
			e.preventDefault();
		});

	}
});


var vkLogin = function() {
	this.init();
}; 

servModel.extendTo(vkLogin, {
	ui_constr: function() {
		return new vkLoginUI(this);
	},
	waitData: function() {
		this.updateState('wait', true)
	},
	notWaitData: function() {
		this.updateState('wait', false)
	},
	setRequestDesc: function(text) {
		this.updateState('request-description', text);
	},
	requestAuth: function(opts) {
		this.fire('auth-request', opts)
	}
});



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
	
	
	
	
	
};
var seesu_vkappid = 2271620;

var connectApiToSeesu = function(vk_token, access, not_save) {
	var vkapi = new vkApi(vk_token, {
		queue: su.delayed_search.vk_api.queue,
		jsonp: !su.env.cross_domain_allowed
	});

	su.setVkApi(vkapi, vk_token.user_id)
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
	return vkapi;
};

function try_mp3_providers(){
	var _u = su._url;
	if (su.env.vkontakte){
		su.vk_app_mode = true;

		var
			vkt = new vkTokenAuth(_u.api_id, {
				user_id: _u.user_id,
				access_token: _u.access_token
			}),
			has_music_access = (_u.api_settings & 8) * 1,
			music_connected = has_music_access;


		var vkapi = connectApiToSeesu(vkt, has_music_access, true);
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

		var _s = document.createElement('script');
		_s.src='http://vk.com/js/api/xd_connection.js';
		_s.onload = function(){
			if (window.VK){
				VK.init(function(){});
				VK.addCallback('onSettingsChanged', function(sts){
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
				window.documentScrollSizeChangeHandler = function(height){
					VK.callMethod("resizeWindow", 640, Math.max(580, height + 70));
				}
			}
			
		};
		document.documentElement.firstChild.appendChild(_s);
		
		
	} else {
	
		su.vk_auth = new vkAuth(seesu_vkappid, {
			bridge: 'http://seesu.me/vk/bridge.html',
			callbacker: 'http://seesu.me/vk/callbacker.html'
		}, ["friends", "video", "offline", "audio", "wall"], false, true ||su.env.deep_sanbdox);


		var save_token = suStore('vk_token_info');
		if (save_token){
			//console.log('token!')
			connectApiToSeesu( new vkTokenAuth(seesu_vkappid, save_token), true);
			//console.log(save_token)
		}

		su.vk_auth
			.on('vk-token-receive', function(token){
				var vk_token = new vkTokenAuth(seesu_vkappid, token);			
				connectApiToSeesu(vk_token, true);
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
								connectApiToSeesu(vk_token, true);

							}
							return true;
							
						}
					}, function(e){
						app_env.openURL(wurl);
					}, 700, 600);
				} else{
					app_env.openURL(wurl);
				}
				su.main_level.updateState('wait-vk-login', true);
			});

	}
}	
