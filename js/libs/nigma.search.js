//http://ex.fm/api/v3/song/search/rameau
var NigmaAPI = function(queue, cache_ajax) {
	if (queue){
		this.queue = queue;
	}
	if (cache_ajax){
		this.cache_ajax = cache_ajax;
	}
};
NigmaAPI.prototype = {
	constructor: NigmaAPI,
	cache_namespace:"nigma",
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
						complex_response.xhr = aReq({
							url: "http://nigma.ru/" + (method || ""),
							type: "GET",
							dataType: "text",
							data: params_full,
							timeout: 20000,
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

			

		
		return complex_response;
	}
};


var NigmaMusicSearch = function(api) {
	this.api = api;
	var _this = this;
	this.search = function() {
		return _this.findAudio.apply(_this, arguments);
	}
};

NigmaMusicSearch.prototype = {
	constructor: NigmaMusicSearch,
	getById: function() {
		return this.api.getSongById.apply(this.api, arguments);
	},
	name: "nigma",
	description:'nigma.ru',
	slave: false,
	s: {name: 'nigma', key: 0, type:'mp3'},
	preferred: null,
	makeSong: function(cursor, sc_key){

		var entity = {
			artist  	: HTMLDecode(cursor.artist),
			track		: HTMLDecode(cursor.title),
			link		: cursor.url,
			from		: 'exfm',
			page_link	: cursor.sources && cursor.sources[0],
			_id			: cursor.id,
			type: 'mp3',
			models: {},
			getSongFileModel: getSongFileModel
		};
		
		
		return entity
	},
	findAudio: function(msq, opts) {
		var
			_this = this,
			query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));

		opts = opts || {};
		opts.cache_key = opts.cache_key || query;

		var params_u = {
			t: "music",
			s: query
		};

		var async_ans = this.api.get(false, params_u, opts);

		var olddone = async_ans.done,
			result;

		async_ans.done = function(cb) {
			olddone.call(this, function(r) {
				if (!result){
					var music_list = [];
					if (r){
						var doc =  getCleanDocumentBodyHTML(r);
						var snippets = $(doc).find(".musicSnippet");
						snippets.each(function(i, el) {
							var title_node = $(el).parent().children(".snippet_title");
							var full_title = title_node.text().split(/(?:\s)[\—\-\—](?:\s)/gi);
							var artist = $.trim(full_title[0]);
							if (msq.artist && msq.artist != artist){
								if (msq.artist.toLowerCase() != artist.toLowerCase()){
									return
								}
								
							}
							var track = $.trim(full_title[1]);


							var mp3_links = [];

							snippets.find("td.download a").each(function(i, el){
								mp3_links.push($(el).attr("href"));
								
							});
							console.log(full_title)
							console.log(mp3_links);

						});
					}
					
						

					

					//snippet_title
					//musicSnippet
					
					/*
					if (r && r.songs.length){
						for (var i=0; i < r.songs.length; i++) {
							var ent = _this.makeSong(r.songs[i]);
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
					*/
				}
				cb(result, 'mp3');

			});
			return this;
		};
		return async_ans;
	}

};


