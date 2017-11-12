define(function(require) {
'use strict';
var spv = require('spv');
var aReq = require('./aReq');
var hex_md5 = require('hex_md5');
var wrapRequest = require('./wrapRequest');

var GoogleSoundcloud = function() {};
spv.Class.extendTo(GoogleSoundcloud, {
  init: function(opts) {
    this.cache_ajax = opts.cache_ajax;
    this.queue = opts.queue;
    this.crossdomain = opts.crossdomain;
  },
  checkResponse: function() {
    return;
  },
  thisOriginAllowed: true,
  source_name: 'google.com',
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
      timeout: 20000,
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
});
var DiscogsApi = function() {};
spv.Class.extendTo(DiscogsApi, {
  init: function(opts) {
    this.cache_ajax = opts.cache_ajax;
    this.queue = opts.queue;
    this.crossdomain = opts.crossdomain;
    this.key = opts.key;
    this.secret = opts.secret;
  },
  errors_fields: ['error'],
  source_name: 'discogs.com',
  cache_namespace: 'discogs',
  get: function(path, params, options) {


    if (!path){
      throw new Error('wrong path');
    }

    options = options || {};
    params = params || {};

    if (options && options.paging) {


      params.per_page = options.paging.page_limit;
      params.page = options.paging.next_page;
    }


    options.cache_key = options.cache_key || hex_md5("https://api.discogs.com" + path + spv.stringifyParams(params));

    if (this.key) {
      params.key = this.key;
    }

    if (this.secret) {
      params.secret = this.secret;
    }



    //cache_ajax.get('vk_api', p.cache_key, function(r){

    var wrap_def = wrapRequest({
      url: "https://api.discogs.com" + path,
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
      thisOriginAllowed: false,
      context: options.context
    }, {
      cache_ajax: this.cache_ajax,
      nocache: options.nocache,
      cache_key: options.cache_key,
      cache_timeout: options.cache_timeout,
      cache_namespace: this.cache_namespace,
      requestFn: aReq,
      queue: this.queue,
      responseFn: function(r) {
        if (r.meta && r.data){
          r = r.data;
        }
        return r;
      }
    });

    return wrap_def.complex;
  }
});

var MixcloudApi = function() {};
spv.Class.extendTo(MixcloudApi, {
  init: function(opts) {
    this.cache_ajax = opts.cache_ajax;
    this.queue = opts.queue;
    this.crossdomain = opts.crossdomain;
  },
  errors_fields: ['error'],
  thisOriginAllowed: true,
  source_name: 'mixcloud.com',
  cache_namespace: 'mixcloud',
  get: function(path, params, options) {


    if (!path){
      throw new Error('wrong path');
    }

    options = options || {};

    params = params || {};
    if (options && options.paging) {
      options.paging.limit = options.paging.page_limit;
      options.paging.offset = (options.paging.next_page - 1) * options.paging.page_limit;
    }

    options.cache_key = options.cache_key || hex_md5("https://api.mixcloud.com/" + path + spv.stringifyParams(params));

    //cache_ajax.get('vk_api', p.cache_key, function(r){

    var wrap_def = wrapRequest({
      url: "https://api.mixcloud.com/" + path,
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
  checkResponse: function(r) {
    return !r.version;
  },
  source_name: 'hypem.com',
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

      },
      context: options.context
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
  MixcloudApi: MixcloudApi,
  HypemApi:HypemApi
};

});
