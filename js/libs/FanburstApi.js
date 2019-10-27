define(function(require) {
'use strict';
var spv = require('spv');
var aReq = require('js/modules/aReq');
var wrapRequest = require('js/modules/wrapRequest');
var hex_md5 = require('hex_md5');

var FanburstApi = function(client_id, queue, crossdomain, cache_ajax) {
  this.queue = queue;
  this.client_id = client_id;
  this.crossdomain = crossdomain;
  this.cache_ajax = cache_ajax;
};

FanburstApi.prototype = {
  errors_fields: [],
  constructor: FanburstApi,
  source_name: 'soundcloud.com',
  cache_namespace: "soundcloud_api",
  thisOriginAllowed: true,
  get: function(method, params_raw, options) {
    if (!method) {return;}

    options = options || {};
    var params = params_raw ? spv.cloneObj({}, params_raw) : {};

    if (options && options.paging) {
      params.per_page = options.paging.page_limit;
      params.offset = options.paging.page_limit * (options.paging.next_page -1);
    }

    params.client_id = this.client_id;

    options.cache_key = options.cache_key || hex_md5("https://api.fanburst.com/" + method + spv.stringifyParams(params));

    var wrap_def = wrapRequest({
      url: "https://api.fanburst.com/" + method + ".json",
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

return FanburstApi;
});
