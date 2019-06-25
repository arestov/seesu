// 4. множественный результат, указание адресата через аргумент

// a - передача state

const action = {
  to: {
    next: [
      'selected', {
        base: 'arg_nesting_next',
        map_values_list_to_target: true,
      },
    ],
  },
  fn({ next_value }) {
    if (!next_value) {
      return null
    }

    return {
      next: [
        true,
        false,
      ],
    }
  },
}


const test = require('ava')

const requirejs = require('../../../requirejs-config')

const spv = requirejs('spv')
const Model = requirejs('pv/Model')
const pvState = requirejs('pv/state')
const getNesting = requirejs('pv/getNesting')
const updateNesting = requirejs('pv/updateNesting')

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

test('map_values_list_to_target in pass', t => {
  const app = setup()
  const steps = makeStepsRunner(app)


  const getA = () => getNesting(app.start_page, 'nest_a')
  const getB = () => getNesting(app.start_page, 'nest_b')

  return steps([
    () => {
      t.is(
        undefined,
        pvState(getA(), 'selected'),
      )
      t.is(
        undefined,
        pvState(getB(), 'selected'),
      )
    },
    () => {
      updateNesting(app.start_page, 'selected', [getA(), getB()])
    },
    () => {
      t.is(
        true,
        pvState(getA(), 'selected'),
      )
      t.is(
        false,
        pvState(getB(), 'selected'),
      )
      //
      // t.throws(() => {
      //   updateNesting(app.start_page, 'selected', [getA()])
      // })
    },
  ])

  function setup() {
    const app = init({
      'chi-start__page': createDeepChild('start', {
        model_name: 'startModel',
        '+nests': {
          nest_a: ['nest', [createDeepChild('nestA')]],
          nest_b: ['nest', [createDeepChild('nestB')]],
        },
        '+passes': {
          'handleNesting:selected': action,
        },
      }),
    }, self => {
      self.start_page = self.initChi('start__page') // eslint-disable-line
    }).app_model

    return app
  }
})
