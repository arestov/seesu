define(require => {
  // app thread;
  const BrowseMap = require('js/libs/BrowseMap')
  const pv = require('pv')
  const animateMapChanges = require('js/libs/provoda/dcl/probe/animateMapChanges')

  const fakeApp = require('./fakeApp')
  const initApp = require('js/utils/initApp')

  const env = {}

  // var root_bwlev = initBrowsing(app_model);
  return function init(app_props, init) {
    const App = fakeApp(app_props, init)
    return initApp(App, env)
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
