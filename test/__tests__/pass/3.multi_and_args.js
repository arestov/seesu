// 4. множественный результат, указание адресата через аргумент

// a - передача state

const action = {
  to: {
    prev: [
      'selected', {
        base: 'arg_nesting_prev',
      },
    ],
    next: [
      'selected', {
        base: 'arg_nesting_next',
      },
    ],
  },
  fn({ prev_value, next_value }) {
    if (!prev_value && !next_value) {
      return null
    }

    if (!prev_value) {
      return {
        next: true,
      }
    }

    if (!next_value) {
      return {
        prev: false,
      }
    }

    return {
      next: true,
      prev: false,
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

test('multiple state to arg base by pass calculated', t => {
  const app = setup()
  const steps = makeStepsRunner(app)


  const getA = () => getNesting(app.start_page, 'nest_a')
  const getB = () => getNesting(app.start_page, 'nest_b')

  return steps([
    () => {
      updateNesting(app.start_page, 'selected', getB())
    },
    () => {
      t.is(
        undefined,
        pvState(getA(), 'selected'),
      )
      t.is(
        true,
        pvState(getB(), 'selected'),
      )
    },
    () => {
      updateNesting(app.start_page, 'selected', getA())
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
