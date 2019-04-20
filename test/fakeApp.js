define(require => {
  const spv = require('spv')
  const AppModel = require('pv/AppModel')
  const prepare = require('js/libs/provoda/structure/prepare')


  return function fakeApp(props, init) {
    const initSelf = init || function () {}
    const all = {
      init: initSelf,
    }
    const App = spv.inh(AppModel, all, props)
    return prepare(App)
  }
})
