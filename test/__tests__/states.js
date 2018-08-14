const test = require('ava')

const requirejs = require('../../requirejs-config')

const pvUpdate = requirejs('pv/update')
const pvState = requirejs('pv/state')

const init = requirejs('test/init')

const waitFlow = require('../waitFlow')

test('state updated', t => {
  const { app_model } = init({})
  t.is(undefined, app_model.state('first_name'))

  pvUpdate(app_model, 'first_name', 'John')

  return waitFlow(app_model).then(app_model => {
    t.is('John', pvState(app_model, 'first_name'))
  })
})

test('simple compx calculated', t => {
  const inited = init({
    '+states': {
      full_name: [
        'compx',
        ['first_name', 'last_name'],
        function (first_name, last_name) {
          if (!first_name || !last_name) {
            return null
          }
          return `${first_name} ${last_name}`
        },
      ],
    },
  })

  const app_model = inited.app_model

  t.is(undefined, pvState(app_model, 'full_name'))

  pvUpdate(app_model, 'first_name', 'John')
  pvUpdate(app_model, 'last_name', 'Smith')


  return waitFlow(app_model).then(app_model => {
    t.is('John Smith', pvState(app_model, 'full_name'))
  })
})
