

var VkLoginB = function() {};
provoda.Model.extendTo(VkLoginB, {
	model_name: 'auth_block_vk',
	init: function(opts, params) {
		this._super();

		var _this = this;
		this.auth = opts.auth;
		this.pmd = opts.pmd;

		var settings_bits;

		if (params){
			if (params.open_opts){
				this.open_opts = params.open_opts;
				if (this.open_opts.settings_bits){
					settings_bits = this.open_opts.settings_bits;
				}
			}
			this.setRequestDesc(params.desc);
		} else {
			this.setRequestDesc();
		}

		if (this.auth.deep_sanbdox){
			_this.updateState('deep-sandbox', true);
		}
		

		if (settings_bits){
			if (this.auth.checkSettings(settings_bits)){
				this.triggerSession();
			}
			this.auth.on('settings-change', function(sts) {
				if ((sts & settings_bits) * 1){
					_this.triggerSession();
				} else {
					_this.updateState('has-session', false);
				}
			});
			
		}

		if (this.auth.has_session){
			this.triggerSession();
		}
		this.auth.once('full-ready', function(){
			_this.triggerSession();
		});

		if (this.auth && this.auth.data_wait){
			this.waitData();
		} else {
			this.auth.on('data-wait', function(){
				_this.waitData();
			});
		}

	},
	bindAuthReady: function(exlusive_space, callback) {
		this.auth.bindAuthReady(exlusive_space, callback, this.open_opts && this.open_opts.settings_bits);
	},
	triggerSession: function() {
		this.updateState('has-session', true);
	},
	waitData: function() {
		this.updateState('data-wait', true);
	},
	notWaitData: function() {
		this.updateState('data-wait', false);
	},
	setRequestDesc: function(text) {
		this.updateState('request-description', text ? text + " " + localize("vk-auth-invitation") : "");
	},
	useCode: function(auth_code){
		if (this.bindAuthCallback){
			this.bindAuthCallback();
		}
		this.auth.setToken(auth_code);

	},
	requestAuth: function(opts) {
		if (this.beforeRequest){
			this.beforeRequest();
		}
		this.auth.requestAuth(opts || this.open_opts);
	},
	switchView: function(){
		this.updateState('active', !this.state('active'));
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
var checkDeadSavedToken = function(vk_token) {
	var saved = suStore('vk_token_info');
	if (saved && saved.access_token == vk_token) {
		suStore("vk_token_info", "", true);
	}
};
var lostAuth = function(vkapi) {
	
	su.mp3_search.remove(vkapi.asearch);
	vkapi.asearch.dead = vkapi.asearch.disabled = true;
	if (su.vk_api == vkapi){
		delete su.vkapi;
	}
	
};


var connectApiToSeesu = function(vk_token, access, not_save) {
	var vkapi = new vkApi(vk_token, {
		queue: su.delayed_search.vk_api.queue,
		jsonp: !app_env.cross_domain_allowed,
		cache_ajax: cache_ajax,
		onAuthLost: function() {
			lostAuth(vkapi);
			checkDeadSavedToken(vk_token);
		}
	});

	su.setVkApi(vkapi, vk_token.user_id);
	if (access){
		su.mp3_search.add(vkapi.asearch, true);
	}
	
	if (vk_token.expires_in){
		setTimeout(function() {
			lostAuth(vkapi);
		}, vk_token.expires_in);
	}
	if (!not_save){
		suStore('vk_token_info', cloneObj({}, vk_token, false, ['access_token', 'expires_in', 'user_id']), true);
	}
	return vkapi;
};
var appendVKSiteApi = function(app_id, cb) {
	yepnope({
		load: 'http://vk.com/js/api/openapi.js',
		complete: function() {
			VK.init({
				apiId: app_id
			}, function(){
				su.trigger("vk-site-api");
				if (cb){
					cb()
				}
			});
			
			
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
			su.vk_auth.api = connectApiToSeesu( new vkTokenAuth(su.vkappid, save_token), true);

			//console.log(save_token)
			if (app_env.web_app){
				appendVKSiteApi(su.vkappid, function() {
					su.vk_auth.trigger('full-ready', true);
				});
			}
			
			
		}

		su.vk_auth
			.on('vk-token-receive', function(token){
				var vk_token = new vkTokenAuth(su.vkappid, token);
				this.api = connectApiToSeesu(vk_token, true);
				if (app_env.web_app){
					appendVKSiteApi(su.vkappid, function() {
						this.trigger('full-ready', true);
					});
				}
				
				
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
								connectApiToSeesu(vk_token, true);

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
			console.log('google search requset error');
		},
		success: function(r){
			console.log(r);
			
		}
	});
};