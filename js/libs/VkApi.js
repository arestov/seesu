define(function(require) {
"use strict";
var spv = require('spv');
var aReq = require('js/modules/aReq');
var wrapRequest = require('js/modules/wrapRequest');
var extendPromise = require('js/modules/extendPromise');
var hex_md5 = require('hex_md5');
var htmlencoding = require('js/common-libs/htmlencoding');
var $ = require('jquery');

var toBigPromise = extendPromise.toBigPromise;

var vkCoreApi = function(){};
spv.Class.extendTo(vkCoreApi, {
  init: function(params) {
    params = params || {};
    if (params.jsonp){
      this.jsonp = true;
    }
    if (params.onAuthLost){
      this.onAuthLost = params.onAuthLost;
    }
  },
  checkResponse: function(r) {
    return !r || !!r.error;
  },
  link: 'https://api.vk.com/method/',
  setAccessToken: function(at){
    this.access_token = at;
  },
  removeAccessToken: function(){
    delete this.access_token;
  },
  hasAccessToken: function(){
    return !!this.access_token;
  },
  get: function() {
    return this.send.apply(this, arguments);
  },
  source_name: 'vk.com',
  cache_namespace: "vk_api",
  send: function(method, params, options){ //nocache, after_ajax, cache_key, only_cache
    var _this = this;

    if (method) {
      options = options || {};
      params = params || {};

      if (options && options.paging) {
        params.count = options.paging.page_limit;
        params.offset = options.paging.page_limit * (options.paging.next_page -1);
      }

      options.cache_key = options.cache_key || hex_md5(method + spv.stringifyParams(params));

      if (!params.v) {
        params.v = '5.0';
      }
      if (this.access_token){
        params.access_token = this.access_token;
      }

      var wrap_def = wrapRequest({
          url: this.link + method,
          type: "GET",
          dataType: this.jsonp ? 'jsonp' : 'json',
          data: params,
          timeout: 20000,
          context: options.context
        }, {
        cache_ajax: this.cache_ajax,
        nocache: options.nocache,
        cache_key: options.cache_key,
        cache_timeout: options.cache_timeout,
        cache_namespace: this.cache_namespace,
        requestFn: aReq,
        responseFn: function(r) {
          if (r && r.error && r.error.error_code == 5){
            if (_this.onAuthLost){
              _this.onAuthLost();
            }
          }
          return r;
        },
        queue: this.queue
      });

      return wrap_def.complex;

    }

  }
});



var VkSearch = function(opts) {
  this.api = opts.api;
  this.mp3_search = opts.mp3_search;
};
VkSearch.prototype = {
  constructor: VkSearch,
  name: "vk",
  description: 'vkontakte.ru',
  slave: false,
  preferred: null,
  //q: p.queue,
  s: {
    name: 'vk',
    key: 'nice',
    type: 'mp3'
  },
  dmca_url: 'https://vk.com/dmca',
  makeSongFile: function(item) {
    return makeSong(item);
  },
  findAudio: function(msq, opts) {
    var query = msq.q ? msq.q: ((msq.artist || '') + ' - ' + (msq.track || ''));

    opts = opts || {};

    var params_u = {};
      params_u.q = query;
      params_u.count = 30;
      params_u.sort = 2;
      params_u.offset = 0;

    var async_ans = this.api.get('audio.search', params_u, opts);

    var deferred = extendPromise($.Deferred(), async_ans);

    async_ans
      .then(function(r) {
        if (r.error){
          deferred.reject.apply(deferred, arguments);
        } else{
          if (r.response.items && r.response.items.length){
            var ml = makeMusicList(r.response.items, msq);

            deferred.resolve.call(deferred, !!ml.length && ml, 'mp3');
          } else {
            deferred.resolve.call(deferred);
          }
        }
      }, function() {
        deferred.reject.apply(deferred, arguments);
      });

    var promise = toBigPromise(deferred);
    promise.cache_used = async_ans.cache_used;

    return promise;
  }
};

function makeSong(cursor){
  if (!cursor || !cursor.url) {
    return;
  }
  return {
    artist	: htmlencoding.decode(cursor.artist ? cursor.artist : cursor.audio.artist),
    duration	: parseFloat(typeof cursor.duration == 'number' ? cursor.duration : cursor.audio.duration) * 1000,
    link		: cursor.url ? cursor.url : cursor.audio.url,
    track		: htmlencoding.decode(cursor.title ? cursor.title : cursor.audio.title),
    from		: 'vk',
    downloadable: false,
    _id			: cursor.owner_id + '_' + cursor.id,
    type: 'mp3',
    media_type: 'mp3'
  };
}

function makeMusicList(r, msq) {
  var music_list = [];
  for (var i=0, l = r.length; i < l; i++) {
    var entity = makeSong(r[i], msq);
    if (!entity) {
      continue;
    }
    if (!entity.link.match(/audio\/.mp3$/)){
      music_list.push(entity);
    }
  }
  return music_list;
}




var VkApi = function(vk_t, params) {
  this.init(params);
  var p = params || {};
  if (p.cache_ajax){
    this.cache_ajax = p.cache_ajax;
  }
  if (vk_t) {
    this.setAccessToken(vk_t.access_token);
  }


  if (p.queue){
    this.queue = p.queue;
  }


  this.asearch = new VkSearch({
    api: this,
    mp3_search: params.mp3_search
  });





};

vkCoreApi.extendTo(VkApi, {
  search_source: {
    name: 'vk',
    key: 'nice'
  }
});
VkApi.VkSearch = VkSearch;

return VkApi;

});
