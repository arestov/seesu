define(function(require) {
'use strict';
//app thread;
var BrowseMap = require('js/libs/BrowseMap');
var pv = require('pv')
var animateMapChanges = require('js/libs/provoda/dcl/probe/animateMapChanges');

var pvUpdate = pv.update;

var fakeApp = require('./fakeApp');

var env = {};

// var root_bwlev = initBrowsing(app_model);
return function init(app_props, init) {
  var views_proxies = new pv.views_proxies.Proxies();
  var App = fakeApp(app_props, init);
  var app_model = new App({
    _highway: {
      models_counters: 1,
      sync_sender: new pv.SyncSender(),
      views_proxies: views_proxies,
      models: {},
      calls_flow: new pv.CallbacksFlow(global),
      proxies: views_proxies,
      env: env
    }
  });

  if (app_model.start_page) {
    initBrowsing(app_model)
  }

  return {
    app_model,
    // root_bwlev,
    views_proxies,
  }
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
