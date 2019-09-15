define(require => {
  const pv = require('pv')

  const initApp = (App, env) => {
    const views_proxies = new pv.views_proxies.Proxies()
    const sync_sender = new pv.SyncSender()
    const flow = new pv.CallbacksFlow(global)
    return new Promise(resolve => {
      flow.input(() => {
        const app_model = new App({
          _highway: {
            models_counters: 1,
            sync_sender,
            views_proxies,
            models: {},
            calls_flow: flow,
            proxies: views_proxies,
            env,
          },
        })

        resolve({
          flow,
          app_model,
          sync_sender,
          // root_bwlev,
          views_proxies,
        })
      })
    })

    // if (app_model.start_page) {
    //   initBrowsing(app_model)
    // }
  }
  return initApp
})
