define(function(require) {
"use strict";
var spv = require('spv');
var aReq = require('js/modules/aReq');
var wrapRequest = require('js/modules/wrapRequest');
var hex_md5 = require('hex_md5');
var htmlencoding = require('js/common-libs/htmlencoding');
var Mp3Search = require('js/models/Mp3Search/index');


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
	checkResponse: function(r) {
		return r && !!(r.error || r.status_text == 'Error');
	},
	source_name: 'exfm',
	get: function(method, params, options) {


		if (method) {
			options = options || {};
			params = params || {};

			if (options && options.paging) {
				params.results = options.paging.page_limit;
				params.start = options.paging.next_page;
			}


			options.cache_key = options.cache_key || hex_md5(method + spv.stringifyParams(params));


			//params_full.consumer_key = this.key;


			//cache_ajax.get('vk_api', p.cache_key, function(r){

			var wrap_def = wrapRequest({
				url: "http://ex.fm/api/v3/" + method,
				type: "GET",
				dataType: this.crossdomain ? "json": "jsonp",
				data: params,
				timeout: 20000,
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
				checkResponse: this.checkResponse,
				requestFn: aReq,
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
	dmca_url: 'http://ex.fm/dmca',
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
			media_type: 'mp3'
		};
		if (!entity.artist){
			var guess_info = Mp3Search.guessArtist(entity.track, msq && msq.artist);
			if (guess_info.artist){
				entity.artist = guess_info.artist;
				entity.track = guess_info.track;
			}
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

		var checkResponse = this.api.checkResponse;

		async_ans.done = function(cb) {
			olddone.call(this, function(r) {
				if (!result){

					var error = checkResponse(r);
					if (!error) {
						var music_list = [];
						if (r && r.songs.length){
							for (var i=0; i < r.songs.length; i++) {
								var cur = r.songs[i];
								if (!cur || !cur.url || cur.url.indexOf('api.soundcloud.com/tracks/') != -1){
									continue;
								}
								var ent = _this.makeSong(r.songs[i], msq);
								music_list.push(ent);



							}
						}

						result = music_list;
					} else {
						result = new Error('bad response from server');
					}



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
