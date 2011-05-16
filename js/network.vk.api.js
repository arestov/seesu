/*global create_jsonp_callback: false, cache_ajax: false, su: false, hex_md5: false, $: false, has_music_copy: false*/

/*
su.vk_api.use('execute', {code:code},function(r){console.log(r)});


var makeBigVKCodeMusicRequest = function(music_list){
	var code = 'return [';
	for (var i=0; i < alist.length; i++) {
		code += '{"query": "' + acon(alist[i] + '", "result": ' + 'API.audio.search({"count":50,"q":"' + acon(alist[i] + '"})' + '}';
		if (i != alist.length -1){
			code += ',';
		}
	};
	code+= '];'
	return code;
}*/

var vk_auth_box = {
	requestAuth: function(p){
		
		this.authInit(p);
		
	},
	createAuthFrame: function(first_key){
		if (this._auth_inited){
			return false;
		}
		this.auth_frame = document.createElement('iframe');	
		addEvent(window, 'message', function(e){
			if (e.data == 'vk_bridge_ready:'){
				e.source.postMessage("add_keys:" + first_key, '*');
			} else if(e.data.indexOf('vk_token:') === 0){
				e.data.replace('vk_sess:','');
				
				console.log('got token!!!!')
				console.log(e.data.replace('vk_sess:',''));
			}
		});
		i.className = 'serv-container';
		i.src = 'http://seesu.me/vk/bridge.html';
		document.body.appendChild(i);
		this._auth_inited = true;
	},
	setAuthBridgeKey: function(key){
		if (!this._auth_inited){
			this.createAuthFrame(key)
		} else{
			this.auth_frame.contentWindow.postMessage("add_keys:" + key, '*');
		}
	},
	authInit: function(p){
		
		
		//init_auth_data.bridgekey		
		
		var init_auth_data = su.vk_api.getInitAuthData(p);
		if (init_auth_data.bridgekey){
			this.setAuthBridgeKey(init_auth_data.bridgekey)
		} 
		
		
		open_url(init_auth_data.link);
		dstates.add_state('body','-waiting-for-finish');
		
		
		return
		
	}
}



function vk_api(apis, queue, iframe, callback, fallback, no_init_check){
	this.audio_collection = {};
	var _this = this;
	this.apis = apis;
	if (apis.length > 1){
		this.allow_random_api = true;
	}
	if (queue){
		this.queue = queue;
	}
	
	if (iframe){
		this.iframe = true;
	}
	if (!this.allow_random_api && !no_init_check){
		this.get_user_info(function(info, r){
			if(info){
				this.user_info = info;
			}
			
			if (callback){
				callback(info, r);
			}
		});
	} else{
		if (callback){
			callback();
		}
	}
	if (fallback){
		this.fallback = fallback;
	}
	this.fallback_counter = 0;
	
	this.search_source = {
		name: 'vk',
		key: this.allow_random_api ? 'rambler' : 'nice'
	};
	


	this.asearch = {
		test: function(mo){
			return canUseSearch(mo, _this.search_source);
		},
		search: function(){
			return _this.audio_search.apply(_this, arguments);
		},
		collectiveSearch: function(){
			return _this.collectAudio.apply(_this, arguments);
		},
		name: this.search_source.name,
		description: 'vkontakte.ru',
		slave: this.allow_random_api ? true: false,
		preferred: null,
		s: this.search_source,
		q: queue,
		getById: function(){
			return _this.getAudioById.apply(_this, arguments);
		}
	};
	
};

vk_api.prototype = {
	legal_apis:[1915003],
	api_link: 'http://api.vk.com/api.php',
	getInitAuthData: function(p){
		var ru = p && p.ru;
		
		var o = {};
		o.link = 'http://www.last.fm/api/auth/?api_key=' + this.apikey ;
		var link_tag = 'http://seesu.me/lastfm/callbacker.html';
		if (!su.env.deep_sanbdox){
			o.bridgekey = hex_md5(Math.random() + 'bridgekey'+ Math.random());
			link_tag += '?key=' + o.bridgekey;
		}
		
		o.link += '&cb=' + encodeURIComponent(link_tag);
		
		
		/*
		var vkdomain = class_name.match(/sign-in-to-vk-ru/) ? 'vkontakte.ru' : 'vk.com';
		if (su.vk_app_mode){
			if (window.VK){
				VK.callMethod('showSettingsBox', 8);
			}
		} else{
			window.open('http://' + vkdomain + '/login.php?app=1915003&layout=openapi&settings=8' + '&channel=http://seesu.me/vk_auth.html');
			seesu.track_event('Auth to vk', 'start');
		}
		*/
	},
	use: function(method, params, callback, error, api_pipi){ //nocache, after_ajax, cache_key, only_cache
		var p = api_pipi || {};
		if (method) {
			var _this = this;
			var api;
			

			
			
			if (_this.allow_random_api){
				api = this.apis[Math.floor(Math.random()*this.apis.length)];
			} else{
				api = this.apis[0];
			}
			var hapi = api.api_id == 8;
			
			

			
			var pv_signature_list = [], // array of <param>+<value>
				params_full = params || {},
				apisig =  true; // yes, we need signature
			
				
				
			var response_callback = function(resp){
				
				var r = (typeof resp == 'object') ? resp : JSON.parse(resp);
				if (!r.error){
					if (typeof cache_ajax == 'object'){
						cache_ajax.set('vk_api', p.cache_key, r);
					}
					
					if (callback) {callback(r, hapi);}
				} else{
					if (r.error.error_code < 5){
						if (_this.fallback){ _this.fallback();}
						
					} 
					if (r.error.error_code < 6){
						if (error) {error(true, hapi);}
						
					}
					
					else{
						if (callback) {callback(r, hapi);}
					}
				}
				
				
			};
				
				
			params_full.method = method;
			params_full.api_id = api.api_id;
			
			params_full.format = 'JSON';
			if (api.sid){
				params_full.sid = api.sid;
			}
			if (typeof su == 'object' && !su.env.cross_domain_allowed && typeof create_jsonp_callback == 'function'){
				params_full.callback = create_jsonp_callback(response_callback);
			}
			if(api.v){
				params_full.v = api.v;
			}
			if(api.test_mode){
				params_full.test_mode = 1;
			}
			
			
			
			if(apisig) {
				params_full.sig = hex_md5(api.viewer_id + stringifyParams(params_full, ['sid'], '=') + api.s);				
				if (!p.cache_key){
					p.cache_key = params_full.sig;
				}
			}
			
			if (typeof cache_ajax == 'object' && api.use_cache && !p.nocache){
				var cache_used = cache_ajax.get('vk_api', p.cache_key, function(r){
					callback(r, hapi);
				});
				if (cache_used) {
					return true;
				}
			}
			
			if (p.only_cache){
				return false;
			}
			
			var request = function(){
				if (typeof cache_ajax == 'object' && api.use_cache && !p.nocache){
					var cache_used = cache_ajax.get('vk_api', p.cache_key, function(r){
						callback(r, hapi);
					});
					if (cache_used) {
						return true;
					}
				}
				
				$.ajax({
				  url: _this.api_link,
				  type: "GET",
				  dataType: params_full.callback ? 'script' : 'json',
				  data: params_full,
				  timeout: 20000,
				  success: !params_full.callback ? response_callback : false,
				  jsonpCallback: params_full.callback ? params_full.callback : false, 
				  error: function(xhr){
					if (error && xhr) {error(false, hapi);}
					
				  }
				});
				if (p.after_ajax) {p.after_ajax();}
			};
			if (_this.queue){
				return _this.queue.add(request, p.not_init_queue);
			} else{
				request();
				return true;
			}
			
			
		}
	},
	get_user_info: function(callback){
		this.use('getProfiles', {
			uids:this.apis[0].viewer_id,
			fields: 'uid, first_name, last_name, domain, sex, city, country, timezone, photo, photo_medium, photo_big'
			
		}, function(r){
			if(callback){
				callback(r && r.response && r.response[0], r);
			}
			console.log(r);
		}, false, {nocache: true});
	},
	makeVKSong: function(cursor, hapi){
		if (cursor && cursor.url){
			return {
						artist	: HTMLDecode(cursor.artist ? cursor.artist : cursor.audio.artist),
						duration	: cursor.duration ? cursor.duration : vksong.audio.duration,
						link		: cursor.url ? cursor.url : cursor.audio.url,
						track		: HTMLDecode(cursor.title ? cursor.title : cursor.audio.title),
						from		: 'vk',
						downloadable: hapi,
						_id			: cursor.owner_id + '_' + cursor.aid
					
					}
		} else{
			return false;
		}
		
	},
	getAudioById: function(id, callback, error, nocache, after_ajax, only_cache){
		var _this = this;
		if (typeof su == 'object' && su.track_event){
			su.track_event('mp3 search', 'vk api', !_this.allow_random_api ? 'with auth' : 'random apis');
		}
		var used_successful = this.use('audio.getById', {audios: id}, 
		function(r, hapi){
			if (r && r.response && r.response[0]){
				var entity = _this.makeVKSong(r.response[0], hapi);
				if (entity){
					if (callback) {callback(entity, _this.search_source);}
				} else{
					if (error) {error(_this.search_source);}
				}
			} else{
				if (error) {error(_this.search_source);}
			}
			console.log(r);
			return 
			
		}, function(xhr, hapi){
			if (error){error(_this.search_source);}
		}, {
			nocache: nocache, 
			after_ajax: after_ajax, 
			cache_key: id, 
			only_cache: only_cache,
			not_init_queue: true
		});
		return used_successful;
	},
	audioResponceHandler: function(r, hapi, callback, errorCallback){
		var _this = this;
		
			var music_list = [];
			for (var i=1, l = r.length; i < l; i++) {
				var entity = _this.makeVKSong( r[i], hapi);
				
				if (entity && !entity.link.match(/audio\/.mp3$/) && !has_music_copy(music_list,entity)){
					music_list.push(entity);
				}
			
			
			}
			if (music_list && music_list.length){
				if (callback) {callback(music_list, _this.search_source);}
			} else{
				if (errorCallback) {errorCallback(_this.search_source);}
			}
		

		
	},
	audio_search: function(msq, callback, error, nocache, after_ajax, only_cache){
		
		var query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));
		
		var _this = this;
		var params_u = {};
			params_u.q = query;
			params_u.count = params_u.count || 30;
		
		if (typeof su == 'object' && su.track_event){
			su.track_event('mp3 search', 'vk api', !_this.allow_random_api ? 'with auth' : 'random apis');
		}
		
	
			
		var used_successful = this.use('audio.search', params_u, 
		function(r, hapi){
			if (r.response && (r.response.length > 1 )) {
				_this.audioResponceHandler(r.response, hapi, callback, error);
			} else{
				if (error) {error(_this.search_source);}
			}
			
		}, function(xhr, hapi){
			if (error){error(_this.search_source);}
		}, {
			nocache: nocache, 
			after_ajax: after_ajax, 
			cache_key: query, 
			only_cache: only_cache,
			not_init_queue: true
		});
		return used_successful;
	},
	addToAudioCollection: function(collection_key, cooperaty, last_in_collection){
		
		var _this = this;
		var c = (this.audio_collection[collection_key] || (this.audio_collection[collection_key] = []));
		var is_dublicate = false;
		for (var i=0; i < c.length; i++) {
			if (c[i].query == cooperaty.query){
				is_dublicate = true;
			}
			break
			
		};
		if (is_dublicate){
			return false;
		}
		
		clearTimeout(c.auto_send);
		
		
		if (this.getActualAudioCollectionPart(collection_key).length > 4){
			this.sendCollection(collection_key)
		}
		c.push(cooperaty);
		
		if (last_in_collection){
			this.sendCollection(collection_key)
		} else{
			
			c.auto_send = setTimeout(function(){
				_this.sendCollection(collection_key);
			},3000);
		}
		
	},
	getActualAudioCollectionPart: function(collection_key){
		var c = this.audio_collection[collection_key];
		var actual = [];
		for (var i=0; i < c.length; i++) {
			if (!c[i].disabled){
				actual.push(c[i]);
			}
			
		};
		return actual;
	},
	sendCollection: function(collection_key){
		var _this = this;
		var ac = this.getActualAudioCollectionPart(collection_key);
		if (ac.length){
			var querylist = [];
			for (var i=0; i < ac.length; i++) {
				ac[i].disabled = true;
				querylist.push(ac[i].query)
			};
			su.vk_api.use('execute', {code:this.makeBigVKCodeMusicRequest(querylist)},function(r, hapi){
				if (r && r.response && r.response.length){
					for (var i=0; i < r.response.length; i++) {
						var cursor = r.response[i];
						if (cursor.result && cursor.result.length > 1 ) {
							_this.audioResponceHandler(cursor.result, hapi, ac[i].callback);
						} 
						
					};
				}
				
			});
			
			
		}
	},
	collectAudio: function(msq, callback, error, nocache, after_ajax, only_cache){
		var query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));
		//msq.collect_for
		//msq.last_in_collection
		this.addToAudioCollection(msq.collect_for, {
			query: query,
			callback: callback,
			error: error
		}, msq.last_in_collection);
	},
	makeBigVKCodeMusicRequest: function(query_list){
		var code = 'return [';
		for (var i=0; i < query_list.length; i++) {
			code += '{"query": "' + query_list[i] + '", "result": ' + 'API.audio.search({"count":30,"q":"' + query_list[i] + '"})' + '}';
			if (i != query_list.length -1){
				code += ',';
			}
		};
		code+= '];'
		return code;
	}
};



