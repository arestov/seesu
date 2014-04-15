define(['spv', 'js/modules/aReq', 'js/modules/wrapRequest', 'hex_md5', 'js/common-libs/htmlencoding', 'js/libs/Mp3Search'], function(spv, aReq, wrapRequest, hex_md5, htmlencoding, Mp3Search) {
'use strict';
var ScApi = function(key, queue, crossdomain, cache_ajax) {
	this.queue = queue;
	this.key = key;
	this.crossdomain = crossdomain;
	this.cache_ajax = cache_ajax;
};

ScApi.prototype = {
	errors_fields: [],
	constructor: ScApi,
	cache_namespace: "soundcloud_api",
	thisOriginAllowed: true,
	get: function(method, params, options) {

		if (method) {
			options = options || {};
			params = params || {};

			if (options && options.paging) {
				params.limit = options.paging.page_limit;
				params.offset = options.paging.page_limit * (options.paging.next_page -1);
			}

			

	
			params.consumer_key = this.key;

			options.cache_key = options.cache_key || hex_md5("http://api.soundcloud.com/" + method + spv.stringifyParams(params));

			


			//cache_ajax.get('vk_api', p.cache_key, function(r){

			var wrap_def = wrapRequest({
				url: "http://api.soundcloud.com/" + method + ".js",
				type: "GET",
				dataType: this.crossdomain ? "json": "jsonp",
				data: params,
				timeout: 20000,
				resourceCachingAvailable: true,
				afterChange: function(opts) {
					if (opts.dataType == 'json'){
						opts.headers = null;
					}
					
				},
				thisOriginAllowed: this.thisOriginAllowed,
				context: options.context
			}, {
				cache_ajax: this.cache_ajax,
				nocache: options.nocache,
				cache_key: options.cache_key,
				cache_timeout: options.cache_timeout,
				cache_namespace: this.cache_namespace,
				requestFn: function() {
					return aReq.apply(this, arguments);
				},
				queue: this.queue
			});

			return wrap_def.complex;
		}
	}
};

var ScMusicSearch = function(opts) {
	this.sc_api = opts.api;
	this.mp3_search = opts.mp3_search;

};
ScMusicSearch.prototype = {
	constructor: ScMusicSearch,
	name: "soundcloud",
	description:'soundcloud.com',
	slave: false,
	s: {name: 'soundcloud', key: 0, type:'mp3'},
	dmca_url: 'http://soundcloud.com/pages/dmca_policy',
	preferred: null,
	makeSongFile: function(item) {
		return this.makeSong(item);
	},
	makeSong: function(cursor, msq){
		var search_string = cursor.title;
		var entity;
		if (search_string){

			var guess_info = Mp3Search.guessArtist(search_string, msq && msq.artist);
			
			entity = {
				artist		: htmlencoding.decode(guess_info.artist || cursor.user.permalink || ""),
				track		: htmlencoding.decode(guess_info.track || search_string),
				duration	: cursor.duration,
				link		: (cursor.download_url || cursor.stream_url) + '?consumer_key=' + this.sc_api.key,
				from		: 'soundcloud',
				real_title	: cursor.title,
				page_link	: cursor.permalink_url,
				description : htmlencoding.decode(cursor.description) || false,
				downloadable: cursor.downloadable,
				_id			: cursor.id,
				type: 'mp3',
				media_type: 'mp3',
			};
			if (msq){
				this.mp3_search.setFileQMI(entity, msq);
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
								if (_this.mp3_search.getFileQMI(ent, msq) == -1){
									//console.log(ent)
								} else if (!Mp3Search.hasMusicCopy(music_list,ent)){
									music_list.push(ent);
								}
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

ScApi.ScMusicSearch = ScMusicSearch;
return ScApi;
});