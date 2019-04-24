define(function(require) {
'use strict'
var spv = require('spv');

return function(self, app_env) {
  self.lfm_auth.on('session', function(){
    self.trackEvent('Auth to lfm', 'end');
  });
  self.lfm_auth.on('want-open-url', function(wurl){
    if (app_env.showWebPage){
      app_env.openURL(wurl);
      /*
      var opend = app_env.showWebPage(wurl, function(url){
        var path = url.split('/')[3];
        if (!path || path == 'home'){
          app_env.clearWebPageCookies();
          return true
        } else{
          var sb = 'http://seesu.me/lastfm/callbacker.html';
          if (url.indexOf(sb) == 0){
            var params = get_url_parameters(url.replace(sb, ''));
            if (params.token){
              self.lfm_auth.setToken(params.token);

            }
            app_env.clearWebPageCookies();
            return true;
          }
        }

      }, function(e){
        app_env.openURL(wurl);

      }, 960, 750);
      if (!opend){
        app_env.openURL(wurl);
      }
      */
    } else{
      app_env.openURL(wurl);
    }
    self.trackEvent('Auth to lfm', 'start');

  });
  spv.domReady(window.document, function() {
    self.lfm_auth.try_to_login();
    if (!self.lfm.sk) {
      self.lfm_auth.get_lfm_token();
    }
  });
}
})
