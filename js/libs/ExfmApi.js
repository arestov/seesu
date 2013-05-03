define(['spv', 'js/modules/aReq', 'js/modules/wrapRequest', 'hex_md5', 'js/common-libs/htmlencoding', 'js/libs/Mp3Search'], function(spv, aReq, wrapRequest, hex_md5, htmlencoding, Mp3Search) {
"use strict";

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


		if (method) {
			options = options || {};
			options.cache_key = options.cache_key || hex_md5(method + spv.stringifyParams(params));

			var	params_full = params || {};
			//params_full.consumer_key = this.key;


			//cache_ajax.get('vk_api', p.cache_key, function(r){

			var wrap_def = wrapRequest({
				url: "http://ex.fm/api/v3/" + method,
				type: "GET",
				dataType: this.crossdomain ? "json": "jsonp",
				data: params_full,
				timeout: 20000,
				afterChange: function(opts) {
					if (opts.dataType == 'json'){
						opts.headers = null;
					}
					
				},
				thisOriginAllowed: this.thisOriginAllowed
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

var ExfmMusicSearch = function(opts) {
	this.api = opts.api;
	this.mp3_search = opts.mp3_search;


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
			artist		: htmlencoding.decode(cursor.artist),
			track		: htmlencoding.decode(cursor.title),
			link		: cursor.url,
			from		: 'exfm',
			page_link	: cursor.sources && cursor.sources[0],
			_id			: cursor.id,
			type: 'mp3',
			media_type: 'mp3',
			models: {},
			getSongFileModel: Mp3Search.getSongFileModel
		};
		if (!entity.artist){
			var guess_info = Mp3Search.guessArtist(entity.track, msq && msq.artist);
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

		query = query.replace(/\'/g, '').replace(/\//g, ' ');
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
ExfmApi.ExfmMusicSearch = ExfmMusicSearch;
return ExfmApi;
});