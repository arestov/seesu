
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
					cache_ajax.set('youtube', q, r);
				} 
		});
	}
	
};

var vkLoginUI = function() {};

provoda.View.extendTo(vkLoginUI, {
	init: function(md) {
		this._super();
		this.md = md;
		this.createBase();
		this.setModel(md);
	},
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

provoda.Model.extendTo(vkLogin, {
	ui_constr: vkLoginUI,
	waitData: function() {
		this.updateState('wait', true);
	},
	notWaitData: function() {
		this.updateState('wait', false);
	},
	setRequestDesc: function(text) {
		this.updateState('request-description', text ? text + " " + localize("vk-auth-invitation") : "");
	},
	requestAuth: function(opts) {
		this.trigger('auth-request', opts);
	}
});



tryVKOAuth = function(){
	var init_auth = vk_auth_box.requestAuth({not_open: true});
	if (init_auth.bridgekey){
		var i = window.document.createElement('iframe');	
		i.className = 'serv-container';
		i.src = init_auth.link;
		window.document.body.appendChild(i);
	}
};


var connectApiToSeesu = function(vk_token, access, not_save) {
	var vkapi = new vkApi(vk_token, {
		queue: su.delayed_search.vk_api.queue,
		jsonp: !app_env.cross_domain_allowed,
		cache_ajax: cache_ajax
	});

	su.setVkApi(vkapi, vk_token.user_id);
	if (access){
		su.mp3_search.add(vkapi.asearch, true);
	}
	
	if (vk_token.expires_in){
		setTimeout(function() {
			su.mp3_search.remove(vkapi.asearch);
			vkapi.asearch.dead = vkapi.asearch.disabled = true;
			if (su.vk_api == vkapi){
				delete su.vkapi;
			}
		}, vk_token.expires_in);
	}
	if (!not_save){
		suStore('vk_token_info', cloneObj({}, vk_token, false, ['access_token', 'expires_in', 'user_id']), true);
	}
	return vkapi;
};
var appendVKSiteApi = function(cb) {
	var _s = window.document.createElement('script');
	_s.src='http://vk.com/js/api/xd_connection.js';
	_s.onload = function(){
		if (window.VK){
			VK.init(function(){

			});
			su.trigger("vk-site-api");
			
		}
		
	};
	window.document.documentElement.firstChild.appendChild(_s);
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
		appendVKSiteApi();
		su.once("vk-site-api", function() {
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
			};
		});
		
		
		
	} else {
	
		su.vk_auth = new vkAuth(su.vkappid, {
			bridge: 'http://seesu.me/vk/bridge.html',
			callbacker: 'http://seesu.me/vk/callbacker.html'
		}, ["friends", "video", "offline", "audio", "wall"], false, app_env.deep_sanbdox);


		var save_token = suStore('vk_token_info');
		if (save_token){
			//console.log('token!')
			connectApiToSeesu( new vkTokenAuth(su.vkappid, save_token), true);
			//console.log(save_token)
			if (app_env.web_app){
				appendVKSiteApi();
			}
			
		}

		su.vk_auth
			.on('vk-token-receive', function(token){
				var vk_token = new vkTokenAuth(su.vkappid, token);			
				connectApiToSeesu(vk_token, true);
				if (app_env.web_app){
					appendVKSiteApi();
				}
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
								var vk_token = new vkTokenAuth(su.vkappid, at);
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
};

var isohuntTorrentSearch = function() {

};





var findTorrentMP3Song = function(song) {
	$.ajax({
		global: false,
		type: "GET",
		dataType: "jsonp",
		url: "http://ajax.googleapis.com/ajax/services/search/web?cx=001069742470440223270:ftotl-vgnbs",
		data: {
			v: "1.0",
			q: "allintext:" + song + '.mp3'
		},
		error:function(){
			console.log('google search requset error')
		},
		success: function(r){
			console.log(r);
			
		}
	});
};