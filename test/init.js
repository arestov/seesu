define(require => {
  // app thread;
  const BrowseMap = require('js/libs/BrowseMap')
  const pv = require('pv')
  const animateMapChanges = require('js/libs/provoda/dcl/probe/animateMapChanges')

  const fakeApp = require('./fakeApp')

  const env = {}

  // var root_bwlev = initBrowsing(app_model);
  return function init(app_props, init) {
    const views_proxies = new pv.views_proxies.Proxies()
    const App = fakeApp(app_props, init)
    const app_model = new App({
      _highway: {
        models_counters: 1,
        sync_sender: new pv.SyncSender(),
        views_proxies,
        models: {},
        calls_flow: new pv.CallbacksFlow(global),
        proxies: views_proxies,
        env,
      },
    })

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
    const map = BrowseMap.hookRoot(app, app.start_page)
    app.map = map

    initMapTree(app, app.start_page)

    const bwlev = BrowseMap.showInterest(map, [])
    BrowseMap.changeBridge(bwlev)

    return map
  }


  function initMapTree(app, start_page) {
  // app.useInterface('navi', needs_url_history && navi);
    pv.updateNesting(app, 'navigation', [])
    pv.updateNesting(app, 'start_page', start_page)

    app.map
      .on('bridge-changed', bwlev => {
        animateMapChanges(app, bwlev)
      }, app.getContextOptsI())

    return app.map
  }
})
