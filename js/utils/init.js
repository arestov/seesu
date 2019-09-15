define(require => {
  // app thread;
  const fakeApp = require('./fakeApp')
  const initApp = require('./initApp')

  const env = {}

  // var root_bwlev = initBrowsing(app_model);
  return function init(app_props, init) {
    const App = fakeApp(app_props, init)
    return initApp(App, env)
  }
})
