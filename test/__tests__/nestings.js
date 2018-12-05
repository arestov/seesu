const test = require('ava')

const requirejs = require('../../requirejs-config')

const spv = requirejs('spv')
const Model = requirejs('pv/Model')
const pvUpdate = requirejs('pv/update')
const pvState = requirejs('pv/state')
const getNesting = requirejs('pv/getNesting')
const updateNesting = requirejs('pv/updateNesting')

const init = requirejs('test/init')

const waitFlow = require('../waitFlow')

const toIds = md_list => {
  if (!Array.isArray(md_list)) {
    return md_list && md_list._provoda_id
  }

  return md_list.map(item => item._provoda_id)
}

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

  const indie = createDeepChild('indie')

  const TargetChild = spv.inh(Model, {}, {
    '+nests': {
      indie: ['nest', [indie]],
      list: [
        'nest', [[createDeepChild(1), createDeepChild(2)]],
      ],
      calculated_child: [
        'compx',
        ['number <<< #', 'nickname <<< ^', '<< indie', '<< list'],
        (num, nickname, indie_value, list) => {
          if (num === 100) {
            return list && list.slice(0, 1)
          }

          if (nickname === 'smith') {
            return indie_value
          }

          return list
        },
      ],
    },
  })

  const startModel = createDeepChild('start', {
    model_name: 'startModel',
    '+nests': {
      target_child: ['nest', [TargetChild]],
    },
  })


  const app = init({
    'chi-start__page': startModel,
  }, self => {
    self.start_page = self.initChi('start__page') // eslint-disable-line
  }).app_model

  const step = fn => () => waitFlow(app).then(() => fn())
  const steps = fns => fns.reduce((result, fn) => result.then(step(fn)), waitFlow(app))

  const targetChild = () => (
    getNesting(app.start_page, 'target_child')
  )

  return steps([
    () => {
      const target_child = targetChild()

      const expected = getNesting(target_child, 'list')
      const calculated = getNesting(target_child, 'calculated_child')

      t.deepEqual(
        toIds(expected),
        toIds(calculated),
        'should use default value',
      )
    },
    () => pvUpdate(app.start_page, 'nickname', 'smith'),
    () => {
      const target_child = targetChild()

      const expected = [getNesting(target_child, 'indie')]
      const calculated = getNesting(target_child, 'calculated_child')

      t.deepEqual(
        toIds(expected),
        toIds(calculated),
        'should use "parent" case',
      )
    },
    () => pvUpdate(app, 'number', 100),
    () => {
      const target_child = targetChild()

      const expected = getNesting(target_child, 'list').slice(0, 1)
      const calculated = getNesting(target_child, 'calculated_child')
      const notExpected = [getNesting(target_child, 'indie')]

      t.deepEqual(
        toIds(expected),
        toIds(calculated),
        'should use "root" case',
      )

      t.notDeepEqual(
        toIds(notExpected),
        toIds(calculated),
        'should not use "parent" case',
      )
    },
    () => {
      const target_child = targetChild()
      const change = getNesting(target_child, 'list')[1]

      updateNesting(target_child, 'indie', change)
      pvUpdate(app, 'number', null)
    },
    () => {
      const target_child = targetChild()

      const expected = [getNesting(target_child, 'list')[1]]
      const calculated = getNesting(target_child, 'calculated_child')

      t.deepEqual(
        toIds(expected),
        toIds(calculated),
        'should use special "parent" case',
      )
    },
  ])
})
