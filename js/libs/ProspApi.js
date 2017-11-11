define(function(require) {
"use strict";
var spv = require('spv');
var aReq = require('js/modules/aReq');
var wrapRequest = require('js/modules/wrapRequest');
var hex_md5 = require('hex_md5');
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
  checkResponse: function(r) {
    return !r || !!r.error;
  },
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


return ProspApi;
});
