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
var detach_vkapi = function(search_way, timeout, dead){
	return setTimeout(function(){
		if (dead){
			search_way.dead = true;
		}
		
		search_way.disabled = true;
	}, timeout || 10);
};

var auth_to_vkapi = function(vk_t, save_to_store, app_id, fallback, error_callback, callback){
	var rightnow = ((new Date()).getTime()/1000).toFixed(0);
	if (!vk_t.expires_in || (vk_t.expires_in > rightnow)){
		vk_auth_box.startIndicating();
		
		var _vkapi = new vk_api(vk_t, {
			queue: seesu.delayed_search.vk_api.queue,
			use_cache: true
		}, 
		function(info, r){
			if (info){
				if (seesu.ui && seesu.ui.samples && seesu.ui.samples.vk_login){
					seesu.ui.samples.vk_login.remove(); 
				}
				
				seesu.vk_api = _vkapi;
				su.mp3_search.add(_vkapi.asearch, true);
				
				console.log('got vk api');
				
				if (save_to_store){
					suStore('vk_token_info', vk_t, true);
				}
				
				if (vk_t.expires_in){
					var end = (vk_t.expires_in - rightnow)*1000;
					if (fallback){
						var _t = detach_vkapi(_vkapi.asearch, end + 10000, true);
						setTimeout(function(){
							fallback(function(){
								clearTimeout(_t);
							});
						}, end);
					} else{
						detach_vkapi(_vkapi.asearch, end, true);
					}
				}
				
				seesu.vk.id = vk_t.user_id;

				var _d = cloneObj({data_source: 'vkontakte'}, info);
				su.vk.user_info = _d;
				
				
				
				if (!su.s.loggedIn()){
					su.s.getAuth(vk_t.user_id);
				} else{
					su.s.setInfo('vk', su.vk.user_info);
					su.s.api('user.update', su.vk.user_info);
				}			
				if (callback){callback();}
			} else{
				vk_auth_box.stopIndicating();
				//suStore('vk_session'+app_id, '', true);
				error_callback('no info');
				
			}
			
		},function(){
			detach_vkapi(_vkapi.asearch);
			if (fallback){
				fallback();
			}
			
		});
		return _vkapi;
		
		
		
		
	} else{
		//suStore('vk_session'+app_id, '', true);
		error_callback('expired');
	}
};
var vkTokenAuth = function(vk_t_raw){
	var vk_t = (vk_t_raw ===  Object(vk_t_raw)) ? vk_t_raw : JSON.parse(vk_t_raw);
	vk_t.expires_in = parseFloat(vk_t.expires_in);
	auth_to_vkapi(vk_t, true, 2271620);
};




function vk_api(vk_t, params, callback, fallback, iframe){
	var p = params || {};
	if (p.use_cache){
		this.use_cache = true
	}
	this.core.setAccessToken(vk_t.access_token);
	this.user_id = vk_t.user_id;
	this.audio_collection = {};
	var _this = this;

	if (p.queue){
		this.queue = p.queue;
	}
	
	if (iframe){
		this.iframe = true;
	}
	if (!p.no_init_check){
		this.get_user_info(function(info, r){
			if(info){
				_this.user_info = info;
			}
			
			if (callback){
				callback(info, r);
			}
		}, fallback);
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
		q: p.queue,
		getById: function(){
			return _this.getAudioById.apply(_this, arguments);
		}
	};
	
};
function vkCoreApi(params){
	var p = params || {};
	if (p.jsonp){
		this.jsonp = true;
	}
};
vkCoreApi.prototype = {
	link: 'https://api.vk.com/method/',
	setAccessToken: function(at){
		this.access_token = at;
	},
	removeAccessToken: function(){
		delete this.access_token;	
	},
	hasAccessToken: function(){
		return !!this.access_token;
	}, 
	sendRequest: function(method, params, callback, error){ //nocache, after_ajax, cache_key, only_cache
		
	
		
		if (method) {
			var _this = this;
			var	params_full = params || {};
			if (this.access_token){
				params_full.access_token = this.access_token;
			}
				
			
			if (this.jsonp && typeof create_jsonp_callback == 'function'){
				params_full.callback = create_jsonp_callback(callback);
			}

			$.ajax({
			  url: this.link + method,
			  type: "GET",
			  dataType: params_full.callback ? 'script' : 'json',
			  data: params_full,
			  timeout: 20000,
			  success: !params_full.callback ? callback : false,
			  jsonpCallback: params_full.callback ? params_full.callback : false, 
			  error: function(xhr, text){
				if (error && xhr) {error({network: true, xhr: xhr, text: text})}
				
			  }
			});
		}
	}
};

vk_api.prototype = {
	core: new vkCoreApi({jsonp: !app_env.cross_domain_allowed}),
	use: function(method, params, callback, error, api_pipi){ //nocache, after_ajax, cache_key, only_cache
		var p = api_pipi || {};
		if (method) {
			var _this = this;			
			if (p.cache_key && typeof cache_ajax == 'object' && _this.use_cache && !p.nocache){
				var cache_used = cache_ajax.get('vk_api', p.cache_key, function(r){
					//загрузка кеша
					callback(r);
				});
				if (cache_used) {
					return true;
				}
			}
			if (p.only_cache){
				return false;
			}
			var request = function(){
				if (typeof cache_ajax == 'object' && _this.use_cache && !p.nocache){
					var cache_used = cache_ajax.get('vk_api', p.cache_key, function(r){
						//загрузка кеша
						callback(r);
					});
					if (cache_used) {
						return true;
					}
				}
				_this.core.sendRequest(method, params, function(r){
					if (p.cache_key && typeof cache_ajax == 'object'){
						cache_ajax.set('vk_api', p.cache_key, r);
						//сохранение кеша
					}
					if (!r.error){
						if (callback) {callback(r);}
					} else{
						if (r.error.error_code < 5){
							if (_this.fallback){ error({fallback: true, server: r.error});}
							
						} else if (r.error.error_code >= 5){
							if (error) {error({server: r.error});}
							
						}
					}
					
				}, error);
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
	get_user_info: function(callback, error){
		this.use('getProfiles', {
			uids: this.user_id,
			fields: 'uid, first_name, last_name, domain, sex, city, country, timezone, photo, photo_medium, photo_big'
			
		}, function(r){
			if(callback){
				callback(r && r.response && r.response[0], r);
			}
			console.log(r);
		}, error, {nocache: true});
	},
	makeVKSong: function(cursor){
		if (cursor && cursor.url){
			return {
				artist	: HTMLDecode(cursor.artist ? cursor.artist : cursor.audio.artist),
				duration	: parseFloat(cursor.duration ? cursor.duration : cursor.audio.duration) * 1000,
				link		: cursor.url ? cursor.url : cursor.audio.url,
				track		: HTMLDecode(cursor.title ? cursor.title : cursor.audio.title),
				from		: 'vk',
				downloadable: false,
				_id			: cursor.owner_id + '_' + cursor.aid,
				type: 'mp3'
			
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
		function(r){
			if (r && r.response && r.response[0]){
				var entity = _this.makeVKSong(r.response[0]);
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
			
		}, function(xhr){
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
	audioResponceHandler: function(r, callback, errorCallback){
		var _this = this;
		
			var music_list = [];
			for (var i=1, l = r.length; i < l; i++) {
				var entity = _this.makeVKSong( r[i]);
				
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
		function(r){
			if (r.response && (r.response.length > 1 )) {
				_this.audioResponceHandler(r.response, callback, error);
			} else{
				if (error) {error(_this.search_source, true);}
			}
			
		}, function(xhr){
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
			su.vk_api.use('execute', {code:this.makeBigVKCodeMusicRequest(querylist)},function(r){
				if (r && r.response && r.response.length){
					for (var i=0; i < r.response.length; i++) {
						var cursor = r.response[i];
						if (cursor.result && cursor.result.length > 1 ) {
							_this.audioResponceHandler(cursor.result, ac[i].callback);
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



