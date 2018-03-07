define(function(require) {
  //app thread;
var BrowseMap = require('js/libs/BrowseMap');
var pv = require('pv')
var pvUpdate = pv.update;

var App = require('./fakeApp');

var env = {};

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
});

console.log(1, app_model.state('full_name'));

pvUpdate(app_model, 'first_name', 'John');
pvUpdate(app_model, 'last_name', 'Smith');

console.log(app_model.state('full_name'));

// var root_bwlev = initBrowsing(app_model);

return {
  app_model,
  // root_bwlev,
  views_proxies,
}

function initBrowsing(app) {
  var map = BrowseMap.hookRoot(app, app.start_page);
  app.map = map;

  initMapTree(app, app.start_page);

  var bwlev = BrowseMap.showInterest(map, []);
  BrowseMap.changeBridge(bwlev);

  return map;
}


function initMapTree(app, start_page) {
  // app.useInterface('navi', needs_url_history && navi);
  pv.updateNesting(app, 'navigation', []);
  pv.updateNesting(app, 'start_page', start_page);

  app.map
    .on('bridge-changed', function(bwlev) {
      animateMapChanges(app, bwlev);
    }, app.getContextOptsI());

  return app.map;
};

});
