var scApi = function(key, queue, crossdomain, cache_ajax) {
	this.queue = queue;
	this.key = key;
	this.crossdomain = crossdomain;
	this.cache_ajax = cache_ajax;
};
scApi.prototype = {
	constructor: scApi,
	cache_namespace: "soundcloud_api",
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
			options.cache_key = options.cache_key || hex_md5(method + stringifyParams(params));
			var cache_used;

			var	params_full = params || {};
			params_full.consumer_key = this.key;


			//cache_ajax.get('vk_api', p.cache_key, function(r){

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
						_this.cache_ajax.set(_this.cache_namespace, options.cache_key, r, options.cache_timeout)
					}
				};

				var sendRequest = function() {
					if (complex_response.aborted){
						return;
					}
					if (!options.nocache){
						cache_used = this.cache_ajax.get(_this.cache_namespace, options.cache_key, function(r){
							deferred.resolve(r);
						});
					}
					
					if (!cache_used){
						complex_response.xhr = aReq({
							url: "http://api.soundcloud.com/" + method + ".js",
							type: "GET",
							dataType: _this.crossdomain ? "json": "jsonp",
							data: params_full,
							timeout: 20000,
							afterChange: function(opts) {
								if (opts.dataType == 'json'){
									opts.headers = null;
								}
								
							},
							thisOriginAllowed: true
						})
						.fail(function(xhr){
							deferred.reject.apply(deferred, arguments);
						})
						.done(success);

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
};

var scMusicSearch = function(sc_api) {
	this.sc_api = sc_api;
	var _this = this;
};
scMusicSearch.prototype = {
	constructor: scMusicSearch,
	name: "soundcloud",
	description:'soundcloud.com',
	slave: false,
	s: {name: 'soundcloud', key: 0, type:'mp3'},
	preferred: null,
	makeSongFile: function(item) {
		return this.makeSong(item);
	},
	makeSong: function(cursor, msq){
		var search_string = cursor.title;
		var entity;
		if (search_string){

			var guess_info = guessArtist(search_string, msq && msq.artist);
			
			entity = {
				artist		: HTMLDecode(guess_info.artist || cursor.user.permalink || ""),
				track		: HTMLDecode(guess_info.track || search_string),
				duration	: cursor.duration,
				link		: (cursor.download_url || cursor.stream_url) + '?consumer_key=' + this.sc_api.key,
				from		: 'soundcloud',
				real_title	: cursor.title,
				page_link	: cursor.permalink_url,
				description : HTMLDecode(cursor.description) || false,
				downloadable: cursor.downloadable,
				_id			: cursor.id,
				type: 'mp3',
				models: {},
				getSongFileModel: getSongFileModel
			};
			if (msq){
				entity.query_match_index = new SongQueryMatchIndex(entity, msq) * 1;
			}
			
			
		}
		return entity;
	},
	findAudio: function(msq, opts) {
		var
			_this = this,
			query = msq.q ? msq.q: ((msq.artist || '') + (msq.track ?  (' - ' + msq.track) : ''));

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
							var ent = _this.makeSong(r[i], msq);
							if (ent){
								if (ent.query_match_index == -1){
									//console.log(ent)
								} else if (!has_music_copy(music_list,ent)){
									music_list.push(ent);
								}
							}
						}
					}
					if (music_list.length){
						sortMusicFilesArray(music_list);
						
					}
					result = music_list;
				}
				cb(result, 'mp3');

			});
			return this;
		};
		return async_ans;
	}
};

