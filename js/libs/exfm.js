//http://ex.fm/api/v3/song/search/rameau

var ExfmApi = function(queue, crossdomain, cache_ajax) {
	this.queue = queue;
	this.crossdomain = crossdomain;
	this.cache_ajax = cache_ajax;
};
ExfmApi.prototype = {
	constructor: ExfmApi,
	cache_namespace: "exfm_api",
	thisOriginAllowed: true,
	get: function(method, params, options) {
		var
			_this				= this,
			deferred			= $.Deferred(),
			complex_response	= {
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
			//params_full.consumer_key = this.key;


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
						_this.cache_ajax.set(_this.cache_namespace, options.cache_key, r, options.cache_timeout);
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
							url: "http://ex.fm/api/v3/" + method,
							type: "GET",
							dataType: _this.crossdomain ? "json": "jsonp",
							data: params_full,
							timeout: 20000,
							afterChange: function(opts) {
								if (opts.dataType == 'json'){
									opts.headers = null;
								}
								
							},
							thisOriginAllowed: _this.thisOriginAllowed
						}).done(success).fail(function(xhr){
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
};

var ExfmMusicSearch = function(opts) {
	this.api = opts.api;
	this.mp3_search = opts.mp3_search;
	var _this = this;

};
ExfmMusicSearch.prototype = {
	constructor: ExfmMusicSearch,
	name: "exfm",
	description:'ex.fm',
	slave: false,
	s: {name: 'exfm', key: 0, type:'mp3'},
	preferred: null,
	makeSongFile: function(item) {
		return this.makeSong(item);
	},
	makeSong: function(cursor, msq){

		var entity = {
			artist		: HTMLDecode(cursor.artist),
			track		: HTMLDecode(cursor.title),
			link		: cursor.url,
			from		: 'exfm',
			page_link	: cursor.sources && cursor.sources[0],
			_id			: cursor.id,
			type: 'mp3',
			media_type: 'mp3',
			models: {},
			getSongFileModel: getSongFileModel
		};
		if (!entity.artist){
			var guess_info = guessArtist(entity.track, msq && msq.artist);
			if (guess_info.artist){
				entity.artist = guess_info.artist;
				entity.track = guess_info.track;
			}
		}
		if (msq){
			this.mp3_search.setFileQMI(entity, msq);
			
			
		}
		
		
		return entity;
	},
	findAudio: function(msq, opts) {
		var
			_this = this,
			query = msq.q ? msq.q: ((msq.artist || '') + (msq.track ?  (' - ' + msq.track) : ''));

		opts = opts || {};

		var limit_value =  msq.limit || 30;
		opts.cache_key = opts.cache_key || (query + '_' + limit_value);

		var params_u = {
			results: limit_value
		};

		var async_ans = this.api.get('song/search/' + query, params_u, opts);

		var olddone = async_ans.done,
			result;

		async_ans.done = function(cb) {
			olddone.call(this, function(r) {
				if (!result){
					var music_list = [];
					if (r && r.songs.length){
						for (var i=0; i < r.songs.length; i++) {
							var ent = _this.makeSong(r.songs[i], msq);
							if (_this.mp3_search.getFileQMI(ent, msq) == -1){
								//console.log(ent)
							} else {
								music_list.push(ent);
							}


						
						}
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

