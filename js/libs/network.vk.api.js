var vkCoreApi = function(){};
Class.extendTo(vkCoreApi, {
	init: function(params) {
		params = params || {};
		if (params.jsonp){
			this.jsonp = true;
		}
		if (params.onAuthLost){
			this.onAuthLost = params.onAuthLost;
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
	cache_namespace: "vk_api",
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
			options.cache_key = options.cache_key || hex_md5(method + stringifyParams(params));
			var cache_used;

			var	params_full = params || {};
			if (this.access_token){
				params_full.access_token = this.access_token;
			}


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
					if (r && r.error && r.error.error_code == 5){
						if (_this.onAuthLost){
							_this.onAuthLost();
						}
					}
					deferred.resolve.apply(deferred, arguments);
					if (_this.cache_ajax){
						_this.cache_ajax.set(_this.cache_namespace, options.cache_key, r, options.cache_timeout)
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
						aReq({
						  url: _this.link + method,
						  type: "GET",
						  dataType: this.jsonp ? 'jsonp' : 'json',
						  data: params_full,
						  timeout: 20000,
						})
						.done(success)
						.fail(function(xhr, text){
						  	deferred.reject.apply(deferred, arguments);
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
	if (p.cache_ajax){
		this.cache_ajax = p.cache_ajax;
	}
	this.setAccessToken(vk_t.access_token);

	if (p.queue){
		this.queue = p.queue;
	}

	var _this = this;

	this.asearch = new vkSearch(this);





};

vkCoreApi.extendTo(vkApi, {
	search_source: {
		name: 'vk',
		key: 'nice'
	}
});



var vkSearch = function(vk_api) {
	this.vk_api = vk_api;
	var _this = this;
	this.search =  function(){
		return _this.findAudio.apply(_this, arguments);
	};
};
vkSearch.prototype = {
	constructor: vkSearch,
	name: "vk",
	description: 'vkontakte.ru',
	slave: false,
	preferred: null,
	//q: p.queue,
	s: {
		name: 'vk',
		key: 'nice',
		type: 'mp3'
	},
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
				type: 'mp3',
				models: {},
				getSongFileModel: getSongFileModel
			}
		}
	},
	makeMusicList: function(r, msq) {
		var music_list = [];
		for (var i=1, l = r.length; i < l; i++) {
			var entity = this.makeVKSong(r[i]);
			
			if (entity && !entity.link.match(/audio\/.mp3$/) && !has_music_copy( music_list, entity)){
				music_list.push(entity);
			}
		}
		music_list.sort(function(g,f){
			return by_best_matching_index(g,f, msq);
		});
		return music_list;
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

		var async_ans = this.vk_api.get('audio.search', params_u, opts)
			.done(function(r) {
				if (r.error){
					deferred.reject.apply(deferred, arguments);
				} else{
					if (r.response && (r.response.length > 1 )){
						var ml = _this.makeMusicList(r.response, msq);

						deferred.resolve.call(deferred, !!ml.length && ml, 'mp3');
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
};