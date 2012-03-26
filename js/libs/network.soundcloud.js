var scApi = function(key, queue, crossdomain, cache_ajax) {
	this.queue = queue;
	this.key = key;
	this.crossdomain = crossdomain;
	this.cache_ajax = cache_ajax;
};
scApi.prototype = {
	constructor: scApi,
	get: function(method, params, options) {
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
		if (method) {
			options = options || {};
			options.nocache = options.nocache || !this.cache_ajax;
			var cache_used;

			var	params_full = params || {};
			params_full.consumer_key = this.key;


			//cache_ajax.get('vk_api', p.cache_key, function(r){
			if (!options.nocache){
				options.cache_key = options.cache_key || hex_md5(method + stringifyParams(params));
				cache_used = this.cache_ajax.get('soundcloud_api', options.cache_key, function(r){
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
						_this.cache_ajax.set('soundcloud_api', params.api_sig, r)
					}
				};

				var sendRequest = function() {
					if (complex_response.aborted){
						return
					}
					if (!options.nocache){
						cache_used = this.cache_ajax.get('soundcloud_api', options.cache_key, function(r){
							deferred.resolve(r);
						});
					}
					
					if (!cache_used){
						$.ajax({
							url: "http://api.soundcloud.com/" + method + ".js",
							type: "GET",
							dataType: _this.crossdomain ? "json": "jsonp",
							data: params_full,
							timeout: 20000,
							success: success,
							error:function(xhr){
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
	},
	
	find: function(msq, callback, error, nocache, after_ajax, only_cache){
		var _this = this;
		var query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));
		
		var search_source = {name: 'soundcloud', key: 0};
		var sc_key = getPreloadedNK('sc_key');
		var use_cache = !nocache;
		if (use_cache){
			var cache_used = cache_ajax.get('soundcloud', query, function(r){callback(r,search_source);})
			if (cache_used) {return true;}
		}
		if (only_cache){
			return false;
		}

		var data = {
			consumer_key: sc_key,
			filter:'streamable,downloadable'
		}
		if (query){
			data.q= query
		}
		return this.queue.add(function(){
			seesu.track_event('mp3 search', 'soundcloud search');
			$.ajax({
				timeout: 10000,
				url: "http://api.soundcloud.com/tracks.js",
				global: false,
				type: "GET",
				dataType: _this.crossdomain ? "json": "jsonp",
				data: data,
				error:function(xhr){
					if  (error) {error(search_source);}
				},
				success:function(r,xhr){
					if (r && r.length){
						var music_list = [];
						for (var i=0; i < r.length; i++) {
							var ent = _this.makeSong(r[i], sc_key);
							if (ent){
								if (!has_music_copy(music_list,ent)){
									music_list.push(ent)
								}
							}
						};
					}
					if (music_list && music_list.length){
						music_list.sort(function(g,f){
							return by_best_matching_index(g,f, msq);
						});
						cache_ajax.set('soundcloud', query, music_list);
						if (callback ){
							callback(music_list, search_source);
						}
					} else {
						if  (error) {error(search_source, true);}
					}
					
				}
				  
			})
			if (after_ajax) {after_ajax();}
		}, true);
	},
	getSongById: function(id, callback, error, nocache, after_ajax, only_cache) {
		var _this = this;
		var search_source = {name: 'soundcloud', key: 0};
		var sc_key = this.key;
		var use_cache = !nocache;
		if (use_cache){
			var cache_used = cache_ajax.get('soundcloudgetbyid', id, function(r){callback && callback(r,search_source);})
			if (cache_used) {return true;}
		}
		if (only_cache){
			return false;
		}

		var data = {
			consumer_key: sc_key,
			filter:'streamable,downloadable'
		}
		if (id){
			data.ids= id;
		}
		return this.queue.add(function(){
			seesu.track_event('mp3 search', 'soundcloud search');
			$.ajax({
				timeout: 10000,
				url: "http://api.soundcloud.com/tracks.js",
				global: false,
				type: "GET",
				dataType: "jsonp",
				data: data,
				error:function(xhr){
					if  (error) {error(search_source, true);}
				},
				success:function(r,xhr){
					if (r && r[0] && r[0].download_url){
						var entity = _this.makeSong(r[0], sc_key);
						if (entity){
							cache_ajax.set('soundcloudgetbyid', id, entity);
							if (callback ){
								callback(entity, search_source);
							}
						} else{
							if  (error) {error(search_source, true);}
						}
					}
				}
				  
			})
			if (after_ajax) {after_ajax();}
		}, true);
	}
};

var scMusicSearch = function(sc_api) {
	this.sc_api = sc_api;
	var _this = this;
	this.search = function() {
		return _this.trashMusicSearch.apply(_this, arguments);
	}
};
scMusicSearch.prototype = {
	constructor: scMusicSearch,
	getById: function() {
		return this.sc_api.getSongById.apply(sc_api, arguments);
	},
	name: "soundcloud",
	description:'soundcloud.com',
	slave: false,
	s: {name: 'soundcloud', key: 0},
	preferred: null,
	makeSong: function(cursor, sc_key){
		var search_string = cursor.title || cursor.description;
		if (search_string){
			var replacer = hex_md5(Math.random()+'aaaaaaaaf');
			var t =search_string.replace('-', replacer)
			var _ttl = search_string.split(replacer,2);
			var artist = (_ttl.length == 2) && _ttl[0];
			var track_title = (_ttl.length == 2) && (_ttl[1] && _ttl[1].replace(/^\s*|\s*$/,'') || '') || _ttl[0];
			
			
			if (!artist){
				artist = cursor.user.permalink || '';
			}
			
			var entity = {
				artist  	: HTMLDecode(artist),
				track		: HTMLDecode(track_title),
				duration	: cursor.duration,
				link		: (cursor.download_url || cursor.stream_url) + '?consumer_key=' + sc_key,
				from		: 'soundcloud',
				real_title	: cursor.title,
				page_link	: cursor.permalink_url,
				description : cursor.description || false,
				downloadable: cursor.downloadable,
				_id			: cursor.id,
				type: 'mp3',
				models: {},
				getSongFileModel: getSongFileModel
			};
			
		}
		return entity
	},
	trashMusicSearch: function(msq, callback, error, nocache, after_ajax, only_cache) {
		var _this = this;

		var async_ans = this.findAudio(msq, {
				only_cache: only_cache,
				nocache: nocache,
				not_init_queue: true
			})
				.done(function(r) {
					if (r && r.length){
						callback(r, _this.s);
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
	},
	findAudio: function(msq, opts) {
		var
			_this = this,
			query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));

		opts = opts || {};
		opts.cache_key = opts.cache_key || query;


		var sc_key = this.key;


		var params_u = {
			filter:'streamable,downloadable',
			limit: 30,
			q: query	
		};

		var async_ans = this.sc_api.get('tracks', params_u, opts);

		var olddone = async_ans.done,
			result;

		async_ans.done = function(cb) {
			olddone.call(this, function(r) {
				if (!result){
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
					result = music_list;
				}
				cb(result);

			});
			return this;
		};
		return async_ans;
	}
};

