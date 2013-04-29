



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


var HypemApi;
var GoogleSoundcloud;
(function() {
"use strict";
GoogleSoundcloud = function() {};
Class.extendTo(GoogleSoundcloud, {
	init: function(opts) {
		this.cache_ajax = opts.cache_ajax;
		this.queue = opts.queue;
		this.crossdomain = opts.crossdomain;
	},
	thisOriginAllowed: true,
	cache_namespace: 'goog_sc',
	get: function(query, params, options) {
		if (!query){
			throw new Error('wrong query');
		}
		var params_data = {
			cx: "001069742470440223270:t1xni-63__0",
			v: "1.0",
			rsz: 1,
			q: query //"allintext:" + song + '.mp3'
		};
		options = options || {};
		options.cache_key = options.cache_key || hex_md5("https://ajax.googleapis.com/ajax/services/search/web" +  spv.stringifyParams(params_data));


		var wrap_def = app_serv.wrapRequest({
			url: "https://ajax.googleapis.com/ajax/services/search/web",
			type: "GET",
			dataType: this.crossdomain ? "json": "jsonp",
			data: params_data,
			timeout: 20000
		}, {
			cache_ajax: this.cache_ajax,
			nocache: options.nocache,
			cache_key: options.cache_key,
			cache_timeout: options.cache_timeout,
			cache_namespace: this.cache_namespace,
			requestFn: function() {
				return aReq.apply(this, arguments);
			},
			queue: this.queue
		});

		return wrap_def.complex;
	}
});
window.DiscogsApi = function() {};
Class.extendTo(DiscogsApi, {
	init: function(opts) {
		this.cache_ajax = opts.cache_ajax;
		this.queue = opts.queue;
		this.crossdomain = opts.crossdomain;
	},
	cache_namespace: 'discogs',
	get: function(path, params, options) {
		var	_this = this;

		if (!path){
			throw new Error('wrong path');
		}

		options = options || {};
		options.cache_key = options.cache_key || hex_md5("http://api.discogs.com" + path + spv.stringifyParams(params));

		var	params_full = params || {};

		//cache_ajax.get('vk_api', p.cache_key, function(r){

		var wrap_def = app_serv.wrapRequest({
			url: "http://api.discogs.com" + path,
			type: "GET",
			dataType: this.crossdomain ? "json": "jsonp",
			data: params_full,
			timeout: 20000,
			resourceCachingAvailable: true
		}, {
			cache_ajax: this.cache_ajax,
			nocache: options.nocache,
			cache_key: options.cache_key,
			cache_timeout: options.cache_timeout,
			cache_namespace: this.cache_namespace,
			requestFn: function() {
				return aReq.apply(this, arguments);
			},
			queue: this.queue
		});

		return wrap_def.complex;
		
	}
});

HypemApi = function() {};
Class.extendTo(HypemApi, {
	init: function(opts) {
		this.cache_ajax = opts.cache_ajax;
		this.queue = opts.queue;
		this.xhr2 = opts.xhr2;
		this.crossdomain = opts.crossdomain;
		this.can_send = this.xhr2 || this.crossdomain;

	},
	cache_namespace: 'hypem',
	get: function(path, params, options) {
		if (!path){
			throw new Error('wrong path');
		}
		//path
		var full_url = 'http://hypem.com' + path;
		options = options || {};
		options.cache_key = options.cache_key || hex_md5(full_url + spv.stringifyParams(params));

		var wrap_def = app_serv.wrapRequest({
			url: full_url,
			type: "GET",
			dataType: "json",
			data: params,
			timeout: 20000,
			headers: null,
			thisOriginAllowed: true,
			afterChange: function(opts) {
				if (opts.dataType == 'json'){
					opts.headers = null;
				}
				
			}
		}, {
			cache_ajax: this.cache_ajax,
			nocache: options.nocache,
			cache_key: options.cache_key,
			cache_timeout: options.cache_timeout,
			cache_namespace: this.cache_namespace,
			queue: this.queue
		});

		return wrap_def.complex;
	}
});

})();

