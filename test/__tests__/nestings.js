import test from 'ava';

var requirejs = require('../../requirejs-config');
var spv = requirejs('spv');
var pv = requirejs('pv');
var Model = requirejs('pv/Model');
var pvUpdate = requirejs('pv/update');
var pvState = requirejs('pv/state');
var getNesting = requirejs('pv/getNesting');

var init = requirejs('test/init');

var waitFlow = require('../waitFlow');

test("nestings updated", (t) => {
  var Appartment = spv.inh(Model, {}, {
    '+states': {
      'number': [
        'compx',
        [],
        function() {
          return  49588;
        }
      ]
    }
  });

  var person = init({
    'nest-appartment': [Appartment],
  }).app_model;

  return waitFlow(person).then((person) => {
    t.is(undefined, getNesting(person, 'garage'));
    t.is(undefined, pvState(getNesting(person, 'appartment'), 'nothing'));
    t.is(49588, pvState(getNesting(person, 'appartment'), 'number'));
  })

});
