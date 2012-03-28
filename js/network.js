
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
		this.updateState('wait', true);
	},
	notWaitData: function() {
		this.updateState('wait', false);
	},
	setRequestDesc: function(text) {
		this.updateState('request-description', text);
	},
	requestAuth: function(opts) {
		this.fire('auth-request', opts);
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

var seesu_vkappid = 2271620;

var connectApiToSeesu = function(vk_token, access, not_save) {
	var vkapi = new vkApi(vk_token, {
		queue: su.delayed_search.vk_api.queue,
		jsonp: !su.env.cross_domain_allowed
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

try_mp3_providers = function(){
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

		var _s = window.document.createElement('script');
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
				};
			}
			
		};
		window.document.documentElement.firstChild.appendChild(_s);
		
		
	} else {
	
		su.vk_auth = new vkAuth(seesu_vkappid, {
			bridge: 'http://seesu.me/vk/bridge.html',
			callbacker: 'http://seesu.me/vk/callbacker.html'
		}, ["friends", "video", "offline", "audio", "wall"], false, su.env.deep_sanbdox);


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
};


var torrentSearch = function(cross_domain_allowed) {
	this.crossdomain = cross_domain_allowed;
	var _this = this;
	this.search =  function(){
		return _this.findAudio.apply(_this, arguments);
	};
};
torrentSearch.prototype = {
	constructor: torrentSearch,
	cache_namespace: 'google_isohunt',
	name: "torrents",
	s: {
		name:"torrents",
		key:0,
		type: "torrent"
	},
	send: function(query, options) {
		var
			_this				= this,
			deferred 			= $.Deferred(),
			complex_response 	= {
				abort: function(){
					this.aborted = true;
					deferred.reject('abort');
					if (this.queued){
						this.queued.abort();
					}
					if (this.xhr){
						this.xhr.abort();
					}
				}
			};
		deferred.promise( complex_response );
		if (query) {
			options = options || {};
			options.nocache = options.nocache || !this.cache_ajax;
			options.cache_key = options.cache_key || hex_md5(new Date() + query);

			var cache_used;

			
			if (!options.nocache){
				
				cache_used = this.cache_ajax.get(this.cache_namespace, options.cache_key, function(r){
					deferred.resolve(r);
				});
				if (cache_used) {
					complex_response.cache_used = true;
					return complex_response;
				}
			}

			if (!cache_used){
				var success = function(r){
					deferred.resolve.apply(deferred, arguments);
					if (_this.cache_ajax){
						_this.cache_ajax.set(_this.cache_namespace, options.cache_key, r)
					}
				};

				var sendRequest = function() {
					if (complex_response.aborted){
						return
					}
					if (!options.nocache){
						cache_used = this.cache_ajax.get(_this.cache_namespace, options.cache_key, function(r){
							deferred.resolve(r);
						});
					}
					
					if (!cache_used){
						$.ajax({
							url: "http://ajax.googleapis.com/ajax/services/search/web?cx=001069742470440223270:ftotl-vgnbs",
							type: "GET",
							dataType: "jsonp",
							data: {
								v: "1.0",
								q: query //"allintext:" + song + '.mp3'
							},
							timeout: 20000,
							success: success,
							error:function(){
								deferred.reject.apply(deferred, arguments);
							},
							
						});



						if (options.after_ajax){
							options.after_ajax();
						}
						if (deferred.notify){
							deferred.notify('just-requested');
						}
					}

				};

				if (this.queue){
					complex_response.queued = this.queue.add(sendRequest, options.not_init_queue);
				} else{
					sendRequest();
				}
			}

			

		}
		return complex_response;
	},
	findAudio: function(msq, opts) {
		var
			_this = this,
			query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));

		opts = opts || {};
		opts.cache_key = opts.cache_key || query;


		/*var sc_key = this.key;


		var params_u = {
			filter:'streamable,downloadable',
			limit: 30,
			q: query	
		};
*/
		var async_ans = this.send("allintext:" + query + '.mp3', opts);

		var
			result,
			olddone = async_ans.done;

		async_ans.done = function(cb) {
			olddone.call(this, function(r) {
				if (!result){
					result = r.responseData.results;
					for (var i = 0; i < result.length; i++) {
						_this.wrapItem(result[i], msq);
					};
					/*
					var music_list = [];
					if (r && r.length){
						for (var i=0; i < r.length; i++) {
							var ent = _this.makeSong(r[i], _this.sc_api.key);
							if (ent){
								if (!has_music_copy(music_list,ent)){
									music_list.push(ent)
								}
							}
						};
					}
					if (music_list.length){
						music_list.sort(function(g,f){
							return by_best_matching_index(g,f, msq);
						});
						
					}
					result = music_list;*/
				}
				cb(result);

			});
			return this;
		};
		return async_ans;
	},
	wrapItem: function(item, query) {
		item.query = query;
		item.models = {};
		item.getSongFileModel = function(mo, player) {
			return this.models[mo.uid] = this.models[mo.uid] || (new fileInTorrent(this, mo)).setPlayer(player);
		};
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
			console.log('google search requset error')
		},
		success: function(r){
			console.log(r);
			
		}
	});
};