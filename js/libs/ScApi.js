define(function(require) {
'use strict';
var spv = require('spv');
var aReq = require('js/modules/aReq');
var wrapRequest = require('js/modules/wrapRequest');
var hex_md5 = require('hex_md5');

var ScApi = function(key, queue, crossdomain, cache_ajax) {
	this.queue = queue;
	this.key = key;
	this.crossdomain = crossdomain;
	this.cache_ajax = cache_ajax;
};

ScApi.prototype = {
	errors_fields: [],
	constructor: ScApi,
	source_name: 'soundcloud.com',
	cache_namespace: "soundcloud_api",
	thisOriginAllowed: true,
	get: function(method, params, options) {
		if (!method) {return;}

    options = options || {};
    params = params || {};

    if (options && options.paging) {
      params.limit = options.paging.page_limit;
      params.offset = options.paging.page_limit * (options.paging.next_page -1);
    }

    params.consumer_key = this.key;

    options.cache_key = options.cache_key || hex_md5("http://api.soundcloud.com/" + method + spv.stringifyParams(params));

    var wrap_def = wrapRequest({
      url: "http://api.soundcloud.com/" + method + ".json",
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
      requestFn: aReq,
      queue: this.queue
    });

    return wrap_def.complex;
	}
};

return ScApi;
});
