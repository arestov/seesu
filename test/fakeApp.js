define(require => {
  const spv = require('spv')
  const AppModel = require('pv/AppModel')
  const prepare = require('js/libs/provoda/structure/prepare')


  return function fakeApp(props, init) {
    const initSelf = init || function () {}
    const all = {
      init(self) {
        self.app = self
        initSelf(self)
      },
    }
    const model_name = props.model_name || 'app_model'
    const App = spv.inh(AppModel, all, { ...props, model_name })
    return prepare(App)
  }
})
