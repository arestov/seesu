

/*
  1.1 один результат, адресат результата определен "*" способом указания, обычное указание адресата
  to: '*'

  a - передача state
  b - передача nestings
  return { 589592873598724: { nestings: {}, states: {} } }

  setup:
    model + nested_model
    model knows nested_model _provoda_id
    pass action to model
    update nested_model state by _provoda_id
*/

const action = {
  to: ['*'],
  fn: [
    ['my_friend_id'],
    (data, my_friend_id) => ({
      [my_friend_id]: { states: { balance: data.value } },
    }),
  ],
}


const test = require('ava')

const requirejs = require('../../../requirejs-config')

const spv = requirejs('spv')
const Model = requirejs('pv/Model')
const pvUpdate = requirejs('pv/update')
const pvState = requirejs('pv/state')
const pvPass = requirejs('pv/pass')
const getNesting = requirejs('pv/getNesting')

const init = requirejs('test/init')
const makeStepsRunner = require('../../steps')

test('simple pass by * calculated', t => {
  const createDeepChild = (num, props) => {
    const DeepChild = spv.inh(Model, {}, {
      '+states': {
        desc: [
          'compx',
          [],
          () => `DeepChild${num}`,
        ],
      },
      ...props,
    })
    return DeepChild
  }


  const TargetChild = spv.inh(Model, {}, {})

  const startModel = createDeepChild('start', {
    model_name: 'startModel',
    '+nests': {
      my_friend: ['nest', [TargetChild]],
    },
    '+passes': {
      action1: action,
    },
  })


  const app = init({
    'chi-start__page': startModel,
  }, self => {
    self.start_page = self.initChi('start__page') // eslint-disable-line
  }).app_model

  const steps = makeStepsRunner(app)

  return steps([
    () => {
      // save my_friend_id
      pvUpdate(
        app.start_page,
        'my_friend_id',
        pvState(getNesting(app.start_page, 'my_friend'), '_provoda_id'),
      )
    },
    () => {
      // pass action
      pvPass(app.start_page, 'action1', { value: 13 })
    },
    () => {
      // read my_friend state
      t.is(
        13,
        pvState(getNesting(app.start_page, 'my_friend'), 'balance'),
      )
    },
  ])
})
