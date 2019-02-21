const action1 = {
  to: ['age_state'],
  fn: [
    [],
    ({ value: age }) => {
      if (age < 18) {
        return 'young'
      }

      return null
    },
  ],
}

const action2 = {
  to: ['age_state'],
  fn: [
    [],
    ({ value: age }) => {
      if (age >= 40) {
        return 'old'
      }

      return null
    },
  ],
}

const test = require('ava')

const requirejs = require('../../../requirejs-config')

const spv = requirejs('spv')
const Model = requirejs('pv/Model')
const pvState = requirejs('pv/state')
const pvUpdate = requirejs('pv/update')

const init = requirejs('test/init')
const makeStepsRunner = require('../../steps')

const mdl = props => spv.inh(Model, {}, props)
const createDeepChild = (num, props) => mdl({
  '+states': {
    desc: [
      'compx',
      [],
      () => `DeepChild${num}`,
    ],
  },
  ...props,
})

test('simple state by pass1 && pass2 calculated', t => {
  const app = setup()
  const steps = makeStepsRunner(app)

  return steps([
    () => {
      pvUpdate(app.start_page, 'some_prop', 13)
    },
    () => {
      t.is(
        'young',
        pvState(app.start_page, 'age_state'),
      )
    },
    () => {
      pvUpdate(app.start_page, 'some_prop2', 45)
    },
    () => {
      t.is(
        'old',
        pvState(app.start_page, 'age_state'),
      )
    },
  ])

  function setup() {
    const TargetChild = mdl({
      '+nests': {
        indie: [
          'nest', [createDeepChild('indie')],
        ],
        list: [
          'nest', [[createDeepChild(1), createDeepChild(2)]],
        ],
        calculated_child: [
          'compx',
          ['number <<< #', 'nickname <<< ^', '<< indie', '<< list'],
          (num, nickname, indie_value, list) => {
            if (num === 100) {
              return list.slice(0, 1)
            }

            if (nickname === 'smith') {
              return indie_value
            }

            return list
          },
        ],
      },
    })

    const app = init({
      'chi-start__page': createDeepChild('start', {
        model_name: 'startModel',
        '+nests': {
          target_child: ['nest', [TargetChild]],
        },
        '+passes': {
          'handleState:some_prop': action1,
          'handleState:some_prop2': action2,
        },
      }),
    }, self => {
      self.start_page = self.initChi('start__page') // eslint-disable-line
    }).app_model

    return app
  }
})
