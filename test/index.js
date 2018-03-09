import test from 'ava';

var requirejs = require('../requirejs-config');
var pv = requirejs('pv')
var pvUpdate = requirejs('pv/update');
var pvState = requirejs('pv/state');

var init = requirejs('test/init');

test('state updated', t => {
  var app_model = init({}).app_model;
  t.is(undefined, app_model.state('first_name'));

  pvUpdate(app_model, 'first_name', 'John');

  return waitFlow(app_model).then((app_model) => {
    t.is('John', pvState(app_model, 'first_name'))
  })
});

test('simple compx calculated', t => {
  var inited = init({
    '+states': {
      'full_name': [
        'compx',
        ['first_name', 'last_name'],
        function(first_name, last_name) {
          if (!first_name || !last_name) {
            return null;
          }
          return first_name + ' ' + last_name;
        }
      ]
    }
  });

  var app_model = inited.app_model;

  t.is(undefined, pvState(app_model, 'full_name'));

  pvUpdate(app_model, 'first_name', 'John');
  pvUpdate(app_model, 'last_name', 'Smith');


  return waitFlow(app_model).then((app_model) => {
    t.is("John Smith", pvState(app_model, 'full_name'));
  });

});

function waitFlow(app_model) {
  return new Promise((resolve, reject) => {
    app_model.nextTick(() => {
      next(app_model, () => {
        resolve(app_model)
      })
    })
  });
}

function next(app, cb) {
  app._calls_flow.pushToFlow(cb, null, null, null, null, null, {
    complex_order: [Infinity],
    inited_order: [Infinity],
  })
}
