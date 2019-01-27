const test = require('ava')

const requirejs = require('../../requirejs-config')

const spv = requirejs('spv')
const pvState = requirejs('pv/state')
const BrowseMap = requirejs('js/libs/BrowseMap')

const init = requirejs('test/init')

const waitFlow = require('../waitFlow')

const fakeInterface = require('../fakeInterface')

test('state loaded', t => {
  const StartPage = spv.inh(BrowseMap.Model, {}, {
    '+effects': {
      consume: {
        0: {
          type: 'state_request',
          states: ['bio'],

          parse: function parse(data) {
            return [data && data.bio]
          },

          api: '#fake',

          fn: [
            ['someid'],
            function (api, opts, msq) {
              return api.get(`profiles/${55}`, {}, opts)
            },
          ],
        },
      },
    },

    model_name: 'start_page',
    zero_map_level: true,

    '+states': {
      number: [
        'compx',
        [],
        function () {
          return 49588
        },
      ],
    },
  })

  const app = init({
    'api-fake': function () {
      return fakeInterface()
    },
    'chi-start__page': StartPage,
    checkActingRequestsPriority() {

    },
  }, self => {
    self.all_queues = []
    self.start_page = self.initChi('start__page')
  }).app_model

  return waitFlow(app).then(app => app.start_page.requestState('bio').then(() => waitFlow(app))).then(app => {
    t.is('was born', pvState(app.start_page, 'bio'))
  })
})
