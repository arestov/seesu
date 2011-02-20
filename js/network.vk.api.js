/*global create_jsonp_callback: false, cache_ajax: false, su: false, hex_md5: false, $: false, has_music_copy: false*/

window.vk_api = function(apis, queue, iframe, callback, fallback){
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
	if (!this.allow_random_api){
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
};

vk_api.prototype = {
	legal_apis:[1915003],
	api_link: 'http://api.vk.com/api.php',
	use: function(method, params, callback, error, nocache, after_ajax, cache_key, only_cache){

		if (method) {
			var api;
			var _this = this;
			
			if (_this.allow_random_api){
				api = this.apis[Math.floor(Math.random()*this.apis.length)];
			} else{
				api = this.apis[0];
			}
			
			
			

			
			var pv_signature_list = [], // array of <param>+<value>
				params_full = params || {},
				apisig =  true; // yes, we need signature
			
				
				
			var response_callback = function(resp){
				
				var r = (typeof resp == 'object') ? resp : JSON.parse(resp);
				if (!r.error){
					if (typeof cache_ajax == 'object'){
						cache_ajax.set('vk_api', cache_key, r);
					}
					
					if (callback) {callback(r, {used_api: api.api_id});}
				} else{
					if (r.error.error_code < 6){
						if (_this.fallback){ _this.fallback(false, true);}
						
					} else{
						if (callback) {callback(r, {used_api: api.api_id});}
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
				for (var param in params_full) {
					if (param != 'sid'){
						pv_signature_list.push(param  + '=' + params_full[param]);
					}
				}
				
				pv_signature_list.sort();
				var paramsstr = '';
				for (var i=0, l = pv_signature_list.length; i < l; i++) {
					paramsstr += pv_signature_list[i];
				}
				params_full.sig = hex_md5(api.viewer_id + paramsstr + api.s);

			}
			
			if (typeof cache_ajax == 'object' && api.use_cache && !nocache){
				var cache_used = cache_ajax.get('vk_api', cache_key, function(r){
					callback(r, {used_api: api.api_id});
				});
				if (cache_used) {
					return true;
				}
			}
			
			if (only_cache){
				return false;
			}
			
			var request = function(){
				if (typeof cache_ajax == 'object' && api.use_cache && !nocache){
					var cache_used = cache_ajax.get('vk_api', cache_key, function(r){
						callback(r, {used_api: api.api_id});
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
					if (error && xhr) {error(xhr);}
					
				  }
				});
				if (after_ajax) {after_ajax();}
			};
			if (_this.queue){
				return _this.queue.add(request, true);
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
		}, false, true).q.init();
	},
	audio_search: function(query, callback, error, nocache, after_ajax, only_cache){
		
		
		var _this = this;
		var params_u = {};
			params_u.q = query;
			params_u.count = params_u.count || 30;
		
		if (typeof su == 'object' && su.track_event){
			su.track_event('mp3 search', 'vk api', !_this.allow_random_api ? 'with auth' : 'random apis');
		}
		
		
			
		var used_successful = this.use('audio.search', params_u, 
		function(r, cb_params){
			var legal_api = !!~_this.legal_apis.indexOf(cb_params.used_api);
			if (r.response && (r.response.length > 1 )) {
				var music_list = [];
				for (var i=1, l = r.response.length; i < l; i++) {
					var entity = {
						'artist'	: r.response[i].artist ? r.response[i].artist : r.response[i].audio.artist,
						'duration'	: r.response[i].duration ? r.response[i].duration : r.response[i].audio.duration,
						'link'		: r.response[i].url ? r.response[i].url : r.response[i].audio.url,
						'track'		: r.response[i].title ? r.response[i].title : r.response[i].audio.title,
						'from'		:  (legal_api ? 'legal_' : (_this.allow_random_api ? 'random_' : '')) + 'vk_api'
					
					};
					if (!has_music_copy(music_list,entity)){
						music_list.push(entity);
					}
				
				
				}
				if (music_list && music_list.length){
					if (callback) {callback(music_list);}
				} else{
					if (error) {error();}
				}
			
			} else{
				if (error) {error();}
			}
		}, error, nocache, after_ajax, query, only_cache);
		return used_successful;
	}
};



