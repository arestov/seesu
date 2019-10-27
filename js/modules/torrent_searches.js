define(function(require) {
'use strict';
var aReq = require('js/modules/aReq');
var wrapRequest = require('js/modules/wrapRequest');
var hex_md5 = require('hex_md5');
var $ = require('jquery');
var htmlencoding = require('js/common-libs/htmlencoding');
var SongFileModel = require('js/models/SongFileModel');

var getSongFileModel = function(map_parent) {
  map_parent.initSi(SongFileModel.FileInTorrent, null, {file:this});
};

var getHTMLText = function(text) {
  var safe_node = window.document.createElement('div');
  safe_node.innerHTML = text;
  return $(safe_node).text();
};

var isohuntTorrentSearch = function(opts) {
  //this.crossdomain = cross_domain_allowed;
  this.mp3_search = opts.mp3_search;
  this.cache_ajax = opts.cache_ajax;
  //var _this = this;
};
isohuntTorrentSearch.prototype = {
  constructor: isohuntTorrentSearch,
  cache_namespace: 'isohunt',
  name: "torrents",
  s: {
    name:"Isohunt torrents",
    key:0,
    type: "torrent"
  },
  send: function(query, options) {

    if (query) {
      options = options || {};
      options.cache_key = options.cache_key || hex_md5('zzzzzzz' + query);

      var wrap_def = wrapRequest({
        url: "http://ca.isohunt.com/js/json.php",
        type: "GET",
        dataType: "json",
        data: {
          ihq: query
        },
        timeout: 20000,
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
  },
  findAudio: function(msq, opts) {
    var
      _this = this,
      query = msq.q ? msq.q: ((msq.artist || '') + (msq.track ?  (' - ' + msq.track) : ''));

    opts = opts || {};
    opts.cache_key = opts.cache_key || query;

    var async_ans = this.send(query, opts);

    var
      result,
      olddone = async_ans.done;

    async_ans.done = function(cb) {
      olddone.call(this, function(r) {
        if (!result){
          result = [];
          if (r.items && r.items.list){
            for (var i = 0; i < Math.min(r.items.list.length, 10); i++) {
              _this.wrapItem(result, r.items.list[i], msq);
            }
          }

        }
        cb(result, 'torrent');

      });
      return this;
    };
    return async_ans;
  },
  url_regexp: /torrent\_details\/(\d*)\//,
  wrapItem: function(r, sitem, query) {
    r.push({
      isohunt_id: sitem.guid,
      title: getHTMLText(sitem.title),
      media_type: 'torrent',
      torrent_link: 'http://isohunt.com/download/' + sitem.guid,
      query: query,
      getSongFileModel: getSongFileModel
    });
  }
};


var BtdiggTorrentSearch = function(opts) {
  this.mp3_search = opts.mp3_search;
  this.cache_ajax = opts.cache_ajax;
  this.queue = opts.queue;
};

BtdiggTorrentSearch.prototype = {
  cache_namespace: 'btdigg',
  name: "torrents",
  s: {
    name:"Btdigg torrents",
    key:0,
    type: "torrent"
  },
  send: function(query, options) {
    if (query) {
      options = options || {};
      options.cache_key = options.cache_key || hex_md5('zzzzzzz' + query);


      var wrap_def = wrapRequest({
        url: "http://btdigg.org/search?info_hash",
        type: "GET",
        dataType: "text",
        data: {

          q: query //"allintext:" + song + '.mp3'
        },
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
  },
  findAudio: function(msq, opts) {
    var
      _this = this,
      query = msq.q ? msq.q: ((msq.artist || '') + (msq.track ?  (' - ' + msq.track) : ''));

    opts = opts || {};
    opts.cache_key = opts.cache_key || query;
    //torrent_name

    var async_ans = this.send('\"' + msq.artist + '\"' + " " + '\"' + msq.track + '\"' + ' mp3', opts);

    var
      result,
      olddone = async_ans.done;

    async_ans.done = function(cb) {
      olddone.call(this, function(r) {
        if (!result){
          result = [];
          var safe_node = window.document.createElement('html');
          safe_node.innerHTML = r.replace(/src\=/gi, 'none=');
        //	debugger;
          $(safe_node).find('.torrent_name').each(function() {
            _this.wrapItem(result, this, msq);
          });
        }
        cb(result, 'torrent');

      });
      return this;
    };
    return async_ans;
  },
  wrapItem: function(r, item, query) {
    var node = $(item);
    var root_node = node.parent().parent().parent().parent();

    var magnet_link;
    var links = root_node.find('a[href]');
    var i;
    for (i = 0; i < links.length; i++) {
      var href = links[i].href;
      if (href.indexOf('magnet:') === 0){
        magnet_link = href;
        break;
      }

    }
    if (!magnet_link){
      return;
    }

    //console.log(magnet_link);

    r.push({
      torrent_link: magnet_link,
      title: node.text(),

      query: query,
      media_type: 'torrent',
      models: {},
      getSongFileModel: getSongFileModel
    });
  }
};

var googleTorrentSearch = function(opts) {
  this.crossdomain = opts.crossdomain;
  this.mp3_search = opts.mp3_search;
  this.cache_ajax = opts.cache_ajax;
};
googleTorrentSearch.prototype = {
  constructor: googleTorrentSearch,
  cache_namespace: 'google_isohunt',
  name: "torrents",
  s: {
    name:"Google/Isohunt torrents",
    key:0,
    type: "torrent"
  },
  send: function(query, options) {
    if (query) {
      options = options || {};
      options.cache_key = options.cache_key || hex_md5('zzzzzzz' + query);


      var wrap_def = wrapRequest({
        url: "https://ajax.googleapis.com/ajax/services/search/web",
        type: "GET",
        dataType: this.crossdomain ? "json": "jsonp",
        data: {
          cx: "001069742470440223270:ftotl-vgnbs",
          v: "1.0",
          q: query //"allintext:" + song + '.mp3'
        },
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
  },
  findAudio: function(msq, opts) {
    var
      _this = this,
      query = msq.q ? msq.q: ((msq.artist || '') + (msq.track ?  (' - ' + msq.track) : ''));

    opts = opts || {};
    opts.cache_key = opts.cache_key || query;

    var async_ans = this.send("allintext:" + "(" + query  + '.mp3' + ")", opts);

    var
      result,
      olddone = async_ans.done;

    async_ans.done = function(cb) {
      olddone.call(this, function(r) {
        if (!result){
          result = [];
          for (var i = 0; i < r.responseData.results.length; i++) {
            _this.wrapItem(result, r.responseData.results[i], msq);
          }
        }
        cb(result, 'torrent');

      });
      return this;
    };
    return async_ans;
  },
  url_regexp: /torrent\_details\/(\d*)\//,
  wrapItem: function(r, item, query) {
    var isohunt_id = item && item.url && item.url.match(this.url_regexp);
    if (isohunt_id && isohunt_id[1]){
      r.push(item);
      item.isohunt_id = isohunt_id[1];
      item.torrent_link = 'http://isohunt.com/download/' + item.isohunt_id;
      item.query = query;
      item.media_type = 'torrent';
      item.title = item.titleNoFormatting = htmlencoding.decode(item.titleNoFormatting);
      item.models = {};
      item.getSongFileModel = getSongFileModel;
    }

  }
};


return {
  isohuntTorrentSearch: isohuntTorrentSearch,
  googleTorrentSearch:googleTorrentSearch,
  BtdiggTorrentSearch: BtdiggTorrentSearch
};
});
