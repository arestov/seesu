define(function(require) {
  //app thread;
  var App = require('./fakeApp');
  var pv = require('pv')
  var initBrowsing = require('js/initBrowsing');

  var views_proxies = new pv.views_proxies.Proxies();
  var app_model = new App({
    _highway: {
      models_counters: 1,
      sync_sender: new pv.SyncSender(),
      views_proxies: views_proxies,
      models: {},
      calls_flow: new pv.CallbacksFlow(this),
      proxies: views_proxies,
      env: env
    }
  }, seesu_version);

  var root_bwlev = initBrowsing(app_model);

  return {
    app_model,
    root_bwlev,
    views_proxies,
  }
});
