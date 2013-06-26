define(['spv', './aReq', 'hex_md5', './wrapRequest'], function(spv, aReq, hex_md5, wrapRequest) {
"use strict";
var GoogleSoundcloud = function() {};
spv.Class.extendTo(GoogleSoundcloud, {
	init: function(opts) {
		this.cache_ajax = opts.cache_ajax;
		this.queue = opts.queue;
		this.crossdomain = opts.crossdomain;
	},
	thisOriginAllowed: true,
	cache_namespace: 'goog_sc',
	get: function(query, params, options) {
		if (!query){
			throw new Error('wrong query');
		}
		var params_data = {
			cx: "001069742470440223270:t1xni-63__0",
			v: "1.0",
			rsz: 1,
			q: query //"allintext:" + song + '.mp3'
		};
		options = options || {};
		options.cache_key = options.cache_key || hex_md5("https://ajax.googleapis.com/ajax/services/search/web" +  spv.stringifyParams(params_data));


		var wrap_def = wrapRequest({
			url: "https://ajax.googleapis.com/ajax/services/search/web",
			type: "GET",
			dataType: this.crossdomain ? "json": "jsonp",
			data: params_data,
			timeout: 20000
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
});
var DiscogsApi = function() {};
spv.Class.extendTo(DiscogsApi, {
	init: function(opts) {
		this.cache_ajax = opts.cache_ajax;
		this.queue = opts.queue;
		this.crossdomain = opts.crossdomain;
	},
	cache_namespace: 'discogs',
	get: function(path, params, options) {


		if (!path){
			throw new Error('wrong path');
		}

		options = options || {};
		options.cache_key = options.cache_key || hex_md5("http://api.discogs.com" + path + spv.stringifyParams(params));

		var	params_full = params || {};

		//cache_ajax.get('vk_api', p.cache_key, function(r){

		var wrap_def = wrapRequest({
			url: "http://api.discogs.com" + path,
			type: "GET",
			dataType: this.crossdomain ? "json": "jsonp",
			data: params_full,
			timeout: 20000,
			resourceCachingAvailable: true
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
});

var HypemApi = function() {};
spv.Class.extendTo(HypemApi, {
	init: function(opts) {
		this.cache_ajax = opts.cache_ajax;
		this.queue = opts.queue;
		this.xhr2 = opts.xhr2;
		this.crossdomain = opts.crossdomain;
		this.can_send = this.xhr2 || this.crossdomain;

	},
	cache_namespace: 'hypem',
	get: function(path, params, options) {
		if (!path){
			throw new Error('wrong path');
		}
		//path
		var full_url = 'http://hypem.com' + path;
		options = options || {};
		options.cache_key = options.cache_key || hex_md5(full_url + spv.stringifyParams(params));

		var wrap_def = wrapRequest({
			url: full_url,
			type: "GET",
			dataType: "json",
			data: params,
			timeout: 20000,
			headers: null,
			thisOriginAllowed: true,
			afterChange: function(opts) {
				if (opts.dataType == 'json'){
					opts.headers = null;
				}

			}
		}, {
			cache_ajax: this.cache_ajax,
			nocache: options.nocache,
			cache_key: options.cache_key,
			cache_timeout: options.cache_timeout,
			cache_namespace: this.cache_namespace,
			queue: this.queue
		});

		return wrap_def.complex;
	}
});
return {
	GoogleSoundcloud: GoogleSoundcloud,
	DiscogsApi: DiscogsApi,
	HypemApi:HypemApi
};

});