define(function(require) {
'use strict';

var pv = require('pv');
var pvUpdate = require('pv/update')
var spv = require('spv');
var FuncsQueue = require('./libs/FuncsQueue');
var net_apis = require('./modules/net_apis');
var SeesuServerAPI = require('./SeesuServerAPI');
var ScApi = require('./libs/ScApi');
var FanburstApi = require('./libs/FanburstApi');

var LastfmAPIExtended = require('./libs/LastfmAPIExtended');

var VkApi = require('./libs/VkApi');
var initVk = require('./modules/initVk');

var $ = require('jquery');

var StartPage = require('./models/StartPage');

return function(self, app_serv, app_env, cache_ajax, resortQueue) {
  self.all_queues = [];

  var addQueue = function() {
    this.reverse_default_prio = true;
    self.all_queues.push(this);
    return this;
  };

  self.vk = {};
  var lfm = initLfm(self, app_serv, app_env, cache_ajax, resortQueue, addQueue);
  self.lfm = lfm;
  self.useInterface('lfm', lfm);
  initAPIs(self, app_serv, app_env, cache_ajax, resortQueue, addQueue);
  return addQueue;
};


function initAPIs(self, app_serv, app_env, cache_ajax, resortQueue, addQueue) {

  var lfm_auth_params = {
    deep_sandbox: app_env.deep_sandbox || false,
    callback_url: 'http://seesu.me/lastfm/callbacker.html',
    bridge_url: 'http://seesu.me/lastfm/bridge.html'
  }

  pvUpdate(self, 'lfm_auth_params', lfm_auth_params)

  var vk_auth_params = {
    app_id: self.vkappid,
    urls: {
      bridge: 'http://seesu.me/vk/bridge.html',
      callbacker: 'http://seesu.me/vk/callbacker.html'
    },
    permissions: ["friends", "video", "offline", "audio", "wall", "photos"],
    open_api: false,
    deep_sandbox: app_env.deep_sandbox,
    vksite_app: app_env.vkontakte,
    vksite_settings: self._url.api_settings,
    display_type: app_env.tizen_app && 'mobile'
  }

  pvUpdate(self, 'vk_auth_params', vk_auth_params)

  self.vk_queue = new FuncsQueue({
    time: [700, 8000 , 7],
    resortQueue: resortQueue,
    init: addQueue
  });

  self.vk_open_api = new VkApi(null, {
    queue: self.vk_queue,
    jsonp: !app_env.cross_domain_allowed,
    cache_ajax: cache_ajax
  });
  self.vktapi = self.vk_open_api;

  self.useInterface('vk_open_api', self.vk_open_api);
  self.useInterface('vktapi', self.vktapi);

  self.hypem = new net_apis.HypemApi();
  self.hypem.init({
    xhr2: app_env.xhr2,
    crossdomain: app_env.cross_domain_allowed,
    cache_ajax: cache_ajax,
    queue: new FuncsQueue({
      time: [1700, 4000, 4],
      resortQueue: resortQueue,
      init: addQueue
    })
  });
  self.useInterface('hypem', self.hypem);

  self.goog_sc = new net_apis.GoogleSoundcloud();
  self.goog_sc.init({
    crossdomain: app_env.cross_domain_allowed,
    cache_ajax: cache_ajax,
    queue: new FuncsQueue({
      time: [1000, 3000, 4],
      resortQueue: resortQueue,
      init: addQueue
    })
  });
  self.useInterface('goog_sc', self.goog_sc);

  self.discogs = new net_apis.DiscogsApi();
  self.discogs.init({
    crossdomain: app_env.cross_domain_allowed,
    cache_ajax: cache_ajax,
    queue: new FuncsQueue({
      time: [2000, 4000, 4],
      resortQueue: resortQueue,
      init: addQueue
    }),

    key: app_serv.getPreloadedNK('dgs_key'),
    secret: app_serv.getPreloadedNK('dgs_secret')
  });
  self.useInterface('discogs', self.discogs);

  self.mixcloud = new net_apis.MixcloudApi();
  self.mixcloud.init({
    crossdomain: app_env.cross_domain_allowed,
    cache_ajax: cache_ajax,
    queue: new FuncsQueue({
      time: [2000, 4000, 4],
      resortQueue: resortQueue,
      init: addQueue
    })
  });
  self.useInterface('mixcloud', self.mixcloud);





  self.s = new SeesuServerAPI(self, app_serv.store('dg_auth'), self.server_url);
  pv.update(self, 'su_server_api', true);
  self.useInterface('sus', self.s);

  self.s.on('info-change-vk', function(data) {
    pv.update(self, 'vk_info', data);
    pv.update(self, 'vk_userid', data && data.id);
  });

  self.on('vk-api', function(vkapi, user_id) {
    if (vkapi) {
      self.getAuthAndTransferVKInfo(vkapi, user_id);
    }

  });

  if (self.lfm.username){
    pv.update(self, 'lfm_userid', self.lfm.username);
  } else {
    // self.lfm_auth.on('session', function() {
    // 	pv.update(self, 'lfm_userid', self.lfm.username);
    // });
  }

  moreApis(self, app_serv, app_env, cache_ajax, resortQueue, addQueue);
}


function initLfm(su, app_serv, app_env, cache_ajax, resortQueue, addQueue) {
  var lfm = new LastfmAPIExtended();

  lfm.init(app_serv.getPreloadedNK('lfm_key'), app_serv.getPreloadedNK('lfm_secret'), function(key){
    return app_serv.store(key);
  }, function(key, value){
    return app_serv.store(key, value, true);
  }, cache_ajax, app_env.cross_domain_allowed, new FuncsQueue({
    time: [700],
    resortQueue: resortQueue,
    init: addQueue
  }));

  lfm.checkMethodResponse = function(method, data, r) {
    su.start_page.art_images.checkLfmData(method, r);
  };

  return lfm;
}


function moreApis(su, app_serv, app_env, cache_ajax, resortQueue, addQueue){
  spv.domReady(window.document, function() {
    domPart(su, app_serv);
  });

  //su.sc_api = sc_api;
  su.sc_api = new ScApi(app_serv.getPreloadedNK('sc_key'), new FuncsQueue({
    time: [3500, 5000 , 4],
    resortQueue: resortQueue,
    init: addQueue
  }), app_env.cross_domain_allowed, cache_ajax);
  su.useInterface('sc_api', su.sc_api);

  su.fanburst_api = new FanburstApi(app_serv.getPreloadedNK('fanburst_client_id'), new FuncsQueue({
    time: [3500, 5000 , 4],
    resortQueue: resortQueue,
    init: addQueue
  }), app_env.cross_domain_allowed, cache_ajax);
  su.useInterface('fanburst_api', su.fanburst_api);
}


function domPart(su, app_serv){
  su.nextTick(function () {
    initVk(su);
  });

  su.checkUpdates();
  var queue = new FuncsQueue({
    time: [700]
  });
  queue.add(function() {
    createDatastreamIframe('https://arestov.github.io/su_news_iframe/', app_serv, function(data) {
      if (!data) {
        return;
      }
      pv.update(su, 'news_list', StartPage.AppNews.converNews(data));
    });
  });
  queue.add(function() {
    createDatastreamIframe('https://arestov.github.io/su_blocked_music/', app_serv, function(data) {
      if (!data) {
        return;
      }

      var index = {};
      for (var artist in data) {
        var lc_artist = artist.toLowerCase();
        if (data[artist] === true) {
          index[lc_artist] = true;
          continue;
        }

        var lindex = index[lc_artist] = (index[lc_artist] || {});
        for (var i = 0; i < data[artist].length; i++) {
          var cur = data[artist][i];
          if (!cur || typeof cur !== 'string') {
            continue;
          }

          lindex[ lc_artist ][ data[artist][i].toLowerCase() ] = true;

        }

      }
      //forbidden_by_copyrh
      //white_of_copyrh
      pv.update(su, 'forbidden_by_copyrh', index);
    });
  });
  queue.add(function(){
    if (app_serv.app_env.nodewebkit) {
      createDatastreamIframe('https://arestov.github.io/su_update_iframe/', app_serv, function(data) {
        if (!data) {
          return;
        }
        if (data.last_ver && data.last_ver > su.version && data.package_url) {
          var dir_files = global.require('fs').readdirSync(
            global.require('path').resolve(global.require('nw.gui').App.manifest.main, '..')
          );
          if (dir_files.indexOf('.git') == -1) {
            global.require('nodejs/update-receiver')(data.package_url, su.version);
          }

          //var
        }
      });
    }
  });
}

function createDatastreamIframe(url, app_serv, callback, allow_exec) {
  var iframe = window.document.createElement('iframe');
  spv.addEvent(window, 'message', function(e) {
    if (e.source == iframe.contentWindow) {
      callback(e.data);
    }
  });
  if (app_serv.app_env.nodewebkit) {
    iframe.nwdisable = !allow_exec;
    iframe.nwfaketop = !allow_exec;

  }
  $(iframe).css({
    position: 'absolute',
    width: '1px',
    height: '1px',
    visibility: 'hidden',
    'z-index': -10
  });
  iframe.src = url;
  $(window.document.body).append(iframe);
}


});
