import test from 'ava';

var requirejs = require('../requirejs-config');
var init = requirejs('test/init');

var pv = requirejs('pv')
var pvUpdate = pv.update;




test('arrays are equal', t => {
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

  t.is(undefined, app_model.state('full_name'));

  pvUpdate(app_model, 'first_name', 'John');
  pvUpdate(app_model, 'last_name', 'Smith');


  return new Promise((resolve, reject) => {
    app_model.nextTick(() => {
      next(app_model, () => {
        resolve(app_model)
      })
    })

  }).then((app_model) => {
    t.is("John Smith", app_model.state('full_name'));
  });

});


function next(app, cb) {
  app._calls_flow.pushToFlow(cb, null, null, null, null, null, {
    complex_order: [Infinity],
    inited_order: [Infinity],
  })
}
