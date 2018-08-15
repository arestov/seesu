const test = require('ava')

const requirejs = require('../../requirejs-config')

const spv = requirejs('spv')
const Model = requirejs('pv/Model')
const pvUpdate = requirejs('pv/update')
const pvState = requirejs('pv/state')
const getNesting = requirejs('pv/getNesting')

const init = requirejs('test/init')

const waitFlow = require('../waitFlow')

test('nestings updated', t => {
  const Appartment = spv.inh(Model, {}, {
    '+states': {
      number: [
        'compx',
        [],
        () => 49588,
      ],
    },
  })

  const person = init({
    'nest-appartment': [Appartment],
  }).app_model

  return waitFlow(person).then(person => {
    t.is(undefined, getNesting(person, 'garage'))
    t.is(undefined, pvState(getNesting(person, 'appartment'), 'nothing'))
    t.is(49588, pvState(getNesting(person, 'appartment'), 'number'))
  })
})

test('compx with nestings calculated', t => {
  const Brother = spv.inh(Model, {}, {})

  const person = init({
    'nest-brother': [Brother],
    '+states': {
      richest: [
        'compx',
        ['@one:money:brother', 'money'],
        (broher_money, my_money) => broher_money < my_money,
      ],
    },
  }).app_model

  person.nextTick(() => {
    pvUpdate(getNesting(person, 'brother'), 'money', 15)
    pvUpdate(person, 'money', 12)
  })

  return waitFlow(person).then(person => {
    t.is(false, pvState(person, 'richest'))

    pvUpdate(person, 'money', 20)
    return waitFlow(person)
  }).then(person => {
    t.is(true, pvState(person, 'richest'))
  })
})

test('state compx calculated from parent and root states', t => {
  const DeepestChild = spv.inh(Model, {}, {
    '+states': {
      description_name: [
        'compx',
        ['#family_name', '^name', 'name'],
        (family_name, parent_name, name) => `${name} ${family_name}, son of ${parent_name}`,
      ],
    },
  })
  const DeepChild = spv.inh(Model, {}, {
    'nest-child': [DeepestChild],
  })
  const Child = spv.inh(Model, {}, {
    'nest-child': [DeepChild],
  })
  const app = init({
    'nest-child': [Child],
  }).app_model


  return waitFlow(app).then(app => {
    const {
      deep_child,
      deepest_child,
    } = getModels(app)

    pvUpdate(app, 'family_name', 'Smith')
    pvUpdate(deep_child, 'name', 'John')
    pvUpdate(deepest_child, 'name', 'Mike')

    return waitFlow(app)
  }).then(app => {
    const { deepest_child } = getModels(app)
    t.is('Mike Smith, son of John', pvState(deepest_child, 'description_name'))
  })

  function getModels(app) {
    const child = getNesting(app, 'child')
    const deep_child = getNesting(child, 'child')
    const deepest_child = getNesting(deep_child, 'child')

    return {
      child,
      deep_child,
      deepest_child,
    }
  }
})


test('nest compx calculated', t => {
  const createDeepChild = num => {
    const DeepChild = spv.inh(Model, {}, {
      '+states': {
        desc: [
          'compx',
          [],
          () => `DeepChild${num}`,
        ],
      },
    })
    return DeepChild
  }

  const indie = createDeepChild('indie')

  const TargetChild = spv.inh(Model, {}, {
    '+nests': {
      indie: ['nest', [indie]],
      list: [
        'nest', [createDeepChild(1), createDeepChild(2)],
      ],
      calculated_child: [
        'compx',
        ['#number', '@indie', '@list'],
        (num, indie_value, list) => list,
      ],
    },
  })


  const app = init({
    'nest-target_child': [TargetChild],
  }).app_model

  return waitFlow(app).then(app => {
    pvUpdate(app, 'number', 100)
    // pvUpdate(deep_child, 'name', 'John')
    // pvUpdate(deepest_child, 'name', 'Mike')

    return waitFlow(app)
  }).then(app => {
    t.log({
      list: getNesting(app, 'list'),
      calculated_child: getNesting(app, 'calculated_child'),
    })
    t.fail('dd')
    t.is(
      getNesting(app, 'list'),
      getNesting(app, 'calculated_child'),
    )

    // const { deepest_child } = getModels(app)
    // t.is('Mike Smith, son of John', pvState(deepest_child, 'description_name'))
  })
})
