var vkCoreApi = function(){};
Class.extendTo(vkCoreApi, {
	init: function(params) {
		params = params || {};
		if (params.jsonp){
			this.jsonp = true;
		}
	},
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
	get: function() {
		return this.send.apply(this, arguments);
	},
	send: function(method, params, options){ //nocache, after_ajax, cache_key, only_cache
		var _this				= this,
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
	
		
		if (method) {
			options = options || {};
			options.nocache = options.nocache || !this.cache_ajax;
			var cache_used;

			var	params_full = params || {};
			if (this.access_token){
				params_full.access_token = this.access_token;
			}

			//cache_ajax.get('vk_api', p.cache_key, function(r){
			if (!options.nocache){
				options.cache_key = options.cache_key || hex_md5(method + stringifyParams(params));
				cache_used = this.cache_ajax.get('vk_api', options.cache_key, function(r){
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
						_this.cache_ajax.set('vk_api', params.api_sig, r)
					}
				};

				if (this.jsonp && typeof window.create_jsonp_callback == 'function'){
					params_full.callback = window.create_jsonp_callback(success);
				}

				


				var sendRequest = function() {
					if (complex_response.aborted){
						return
					}

					cache_used = this.cache_ajax.get('vk_api', options.cache_key, function(r){
						deferred.resolve(r);
					});
					if (!cache_used){
						$.ajax({
						  url: _this.link + method,
						  type: "GET",
						  dataType: params_full.callback ? 'script' : ( this.jsonp ? 'jsonp' : 'json'),
						  data: params_full,
						  timeout: 20000,
						  success: !params_full.callback ? success : false,
						  jsonpCallback: params_full.callback ? params_full.callback : false, 
						  error: function(xhr, text){
						  	deferred.reject.apply(deferred, arguments);
						  }
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
	}
});

var vkApi = function(vk_t, params) {
	this.init(params);
	var p = params || {};
	this.setAccessToken(vk_t.access_token);

	if (p.queue){
		this.queue = p.queue;
	}

	var _this = this;

	this.asearch = {
		test: function(mo){
			return canUseSearch(mo, _this.search_source);
		},
		search: function(){
			return _this.audio_search.apply(_this, arguments);
		},
		name: this.search_source.name,
		description: 'vkontakte.ru',
		slave: false,
		preferred: null,
		s: this.search_source,
		q: p.queue
	};


};

vkCoreApi.extendTo(vkApi, {
	makeVKSong: function(cursor){
		if (cursor && cursor.url){
			return {
				artist	: HTMLDecode(cursor.artist ? cursor.artist : cursor.audio.artist),
				duration	: parseFloat(typeof cursor.duration == 'number' ? cursor.duration : cursor.audio.duration) * 1000,
				link		: cursor.url ? cursor.url : cursor.audio.url,
				track		: HTMLDecode(cursor.title ? cursor.title : cursor.audio.title),
				from		: 'vk',
				downloadable: false,
				_id			: cursor.owner_id + '_' + cursor.aid,
				type: 'mp3'
			}
		}
		
	},
	makeMusicList: function(r) {
		var music_list = [];
		for (var i=1, l = r.length; i < l; i++) {
			var entity = this.makeVKSong(r[i]);
			
			if (entity && !entity.link.match(/audio\/.mp3$/) && !has_music_copy( music_list, entity)){
				music_list.push(entity);
			}
		}
		return music_list;
	},
	search_source: {
		name: 'vk',
		key: 'nice'
	},
	audio_search: function(msq, callback, error, nocache, after_ajax, only_cache) {
		var _this = this;

		var async_ans = this.findAudio(msq, {
				only_cache: only_cache,
				nocache: nocache,
				not_init_queue: true
			})
				.done(function(r) {
					if (r && r.length){
						callback(r, _this.search_source);
					} else {
						error();
					}
				})
				.fail(function() {
					if (error){error();}
				})
				.progress(function(note){
					if (note == 'just-requested' && after_ajax){
						after_ajax();
					}
				});

		return async_ans.queued || async_ans.cache_used;


		/*
		var used_successful = this.use('audio.search', params_u, 
		function(r){
			if (r.response && (r.response.length > 1 )) {
				_this.audioResponceHandler(r.response, callback, error);
			} else{
				if (error) {error(_this.search_source);}
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
*/

	},
	findAudio: function(msq, opts) {
		var _this		= this,
			deferred 	= $.Deferred(),
			complex_response 	= {
				abort: function(){
					this.aborted = true;
					deferred.reject('abort');
					if (async_ans){
						async_ans.abort();
					}
				}
			},
			query		= msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));

		opts = opts || {};
		opts.cache_key = opts.cache_key || query;


		deferred.promise( complex_response );

		var params_u = {};
			params_u.q = query;
			params_u.count = 30;

		var async_ans = this.get('audio.search', params_u, opts)
			.done(function(r) {
				if (r.error){
					deferred.reject.apply(deferred, arguments);
				} else{
					if (r.response && (r.response.length > 1 )){
						var ml = _this.makeMusicList(r.response);

						deferred.resolve.call(deferred, !!ml.length && ml);
					} else {
						deferred.resolve.call(deferred);
					}
				}
			})
			.fail(function() {
				deferred.reject.apply(deferred, arguments);
			});

		if (async_ans.queued){
			complex_response.queued = async_ans.queued;
		}
		if (async_ans.cache_used){
			complex_response.cache_used = async_ans.cache_used;
		}
		
		return complex_response;
	}
});



