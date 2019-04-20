define(require => {
  const pv = require('pv')

  const initApp = (App, env) => {
    const views_proxies = new pv.views_proxies.Proxies()
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

    // if (app_model.start_page) {
    //   initBrowsing(app_model)
    // }

    return {
      app_model,
      // root_bwlev,
      views_proxies,
    }
  }
  return initApp
})
