define(function(require) {
'use strict';
var app_serv = require('app_serv');
var VkAuth = require('js/libs/VkAuth');
var pv = require('pv');

var app_env = app_serv.app_env;

var pvUpdate = pv.update;

var checkDeadSavedToken = function(vk_token) {
  var saved = app_serv.store('vk_token_info');
  if (saved && saved.access_token == vk_token) {
    app_serv.store("vk_token_info", "", true);
  }
};


var appendVKSiteApi = function(app_id, su) {
  app_serv.loadJS('https://vk.com/js/api/openapi.js', function() {
    VK.init({
      apiId: app_id
    }, function(){

    });
    setTimeout(function() {
      su.trigger("vk-site-api");
    }, 500);
  });
};

var initVk = function(su) {
  var vk_auth = su.getNesting('vk_auth')

  var _u = su._url;
  if (app_env.vkontakte){
    su.vk_app_mode = true;

    var
      vkt = new VkAuth.VkTokenAuth(_u.api_id, {
        user_id: _u.user_id,
        access_token: _u.access_token
      }),
      has_music_access = (_u.api_settings & 8) * 1,
      music_connected = has_music_access;


    if (music_connected) {
      pvUpdate(su, 'vk_search_ready', true);
    }

    var vkapi = su.connectVKApi(vkt, has_music_access, true);


    /*


    var stable_vk_api = auth_to_vkapi({
      user_id: _u.user_id,
      access_token: _u.access_token
    }, false, _u.api_id, false, false, function(){
      if ((_u.api_settings & 8)*1){
        stable_vk_api.asearch.disabled = false;
      } else{
        stable_vk_api.asearch.disabled = true;
      }
    });
    */

    app_serv.loadJS('https://vk.com/js/api/xd_connection.js', function(){
      VK.init(function(){
        su.trigger("vk-site-api");
      });
    });

    vk_auth.on('settings-change', function(sts) {
      if ((sts & 8)*1){
        pvUpdate(su, 'vk_search_ready', true);
        if (!music_connected){
          music_connected = true;
        }
      } else{
        pvUpdate(su, 'vk_search_ready', false);
        if (music_connected){
          music_connected = false;
        }
      }
    });



  } else {



    var save_token = app_serv.store('vk_token_info');
    if (save_token){
      //console.log('token!')
      vk_auth.api = su.connectVKApi( new VkAuth.VkTokenAuth(su.vkappid, save_token), true);

      //console.log(save_token)
      if (app_env.web_app){
        appendVKSiteApi(su.vkappid, su);
      }

      pvUpdate(vk_auth, 'has_token', true);

      vk_auth.trigger('full-ready', true);

    }

    vk_auth
      .on('vk-token-receive', function(token){
        var vk_token = new VkAuth.VkTokenAuth(su.vkappid, token);
        this.api = su.connectVKApi(vk_token, true);
        if (app_env.web_app){
          appendVKSiteApi(su.vkappid, su);
        }

        pvUpdate(this, 'has_token', true);

        this.trigger('full-ready', true);
      })
      .on('want-open-url', function(wurl){
        if (app_env.showWebPage){
          app_env.openURL(wurl);
          /*
          var opend = app_env.showWebPage(wurl, function(url){
            var sb = 'http://seesu.me/vk/callbacker.html';
            if (url.indexOf(sb) == 0){
              app_env.clearWebPageCookies();

              var hash = url.replace(sb, '');

              var hashurlparams = get_url_parameters(hash.replace(/^\#/,''));
              var access_token = hashurlparams.access_token;
              if (access_token){
                var at = {};
                at.access_token = access_token;
                if (hashurlparams.expires_in){
                  at.expires_in = hashurlparams.expires_in;
                }
                at.user_id = hashurlparams.user_id;
                var vk_token = new VkAuth.VkTokenAuth(su.vkappid, at);
                su.connectVKApi(vk_token, true);

              }
              return true;

            }
          }, function(e){
            app_env.openURL(wurl);
          }, 700, 600);
          if (!opend){
            app_env.openURL(wurl);
          }
          */
        } else{
          app_env.openURL(wurl);
        }
        pv.update(su, 'wait-vk-login', true);
        su.trackEvent('Auth to vk', 'start');
      });

  }

};
initVk.checkDeadSavedToken = checkDeadSavedToken;
return initVk;
});
