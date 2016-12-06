define(['spv', 'js/modules/aReq', 'js/modules/wrapRequest', 'hex_md5', 'js/common-libs/htmlencoding', 'js/models/Mp3Search/index'], function(spv, aReq, wrapRequest, hex_md5, htmlencoding, Mp3Search) {
"use strict";



/*

artist: "Radio Killer"
bitrate: "320 Kb/s"
file: "http://pleer.net/browser-extension/files/4423743tEFC.mp3"
id: "4423743tEFC"
length: 384
link: "http://pleer.net/tracks/4423743tEFC"
size: 15397703
track: "Voila"
*/


var ProspApi = function(queue, crossdomain, cache_ajax) {
	this.queue = queue;
	this.crossdomain = crossdomain;
	this.cache_ajax = cache_ajax;
};

ProspApi.prototype = {
	constructor: ProspApi,
	source_name: 'pleer.net',
	cache_namespace: 'pleer.net',
	thisOriginAllowed: false,
	get: function(method, params, options) {
		if (method) {
			options = options || {};
			options.cache_key = options.cache_key || hex_md5(method + spv.stringifyParams(params));

			var	params_full = params || {};
			//params_full.consumer_key = this.key;


			//cache_ajax.get('vk_api', p.cache_key, function(r){

			var wrap_def = wrapRequest({
				headers: null,
				url: "http://pleer.net/browser-extension/" + method,
				type: "GET",
				dataType: this.crossdomain ? "json": "jsonp",
				data: params_full,
				timeout: 20000,
				afterChange: function(opts) {
					if (opts.dataType == 'json'){
						opts.headers = null;
					}

				},
				context: options.context
			}, {
				cache_ajax: this.cache_ajax,
				nocache: options.nocache,
				cache_key: options.cache_key,
				cache_timeout: options.cache_timeout,
				cache_namespace: this.cache_namespace,
				requestFn: aReq,
				queue: this.queue
			});

			return wrap_def.complex;
		}
	}
};
//search?q=killers&page=1&limit=50

var datamorph_map = new spv.MorphMap({
	is_array: true,
	source: 'tracks',
	props_map: {

		_id: 'id',
		page_link: 'link',
		artist: 'artist',
		track: 'track',
		link: 'file',
		duration: 'length'
	}
});


var ProspMusicSearch = function(opts) {
	this.api = opts.api;
	this.mp3_search = opts.mp3_search;
};
var standart_props = {
	from: 'pleer.net',
	type: 'mp3',
	media_type: 'mp3'
};

ProspMusicSearch.prototype = {
	constructor: ProspMusicSearch,
	name: 'pleer.net',
	description:'pleer.net',
	slave: false,
	s: {name: 'pleer.net', key: 0, type:'mp3'},
	dmca_url: 'http://pleer.net/feedback',
	preferred: null,
	makeSongFile: function(item) {
		return this.makeSong(item);
	},
	makeSong: function(cursor, msq){
		cursor.artist = cursor.artist + '';
		cursor.duration = cursor.duration && cursor.duration * 1000;
		spv.cloneObj(cursor, standart_props);

		if (!cursor.artist){
			var guess_info = Mp3Search.guessArtist(cursor.track, msq && msq.artist);
			if (guess_info.artist){
				cursor.artist = guess_info.artist;
				cursor.track = guess_info.track;
			}
		}



		return cursor;
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
			//results: limit_value,
			page: 1,
			limit: limit_value,
			q: query
		};

		var async_ans = this.api.get('search', params_u, opts);

		var olddone = async_ans.done,
			result;

		async_ans.done = function(cb) {
			olddone.call(this, function(r) {
				if (!result){

					var list = datamorph_map(r);
					var music_list = [];

					for (var i = 0; i < list.length; i++) {
						var item = _this.makeSong(list[i], msq);
						music_list.push(item);
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



ProspApi.ProspMusicSearch = ProspMusicSearch;
return ProspApi;
});
