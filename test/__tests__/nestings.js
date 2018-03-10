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

test("compx with nestings calculated", (t) => {
  var Brother = spv.inh(Model, {}, {});

  var person = init({
    'nest-brother': [Brother],
    '+states': {
      'richest': [
        'compx',
        ['@one:money:brother', 'money'],
        function(broher_money, my_money) {
          return broher_money < my_money;
        }
      ]
    }
  }).app_model;

  person.nextTick(() => {
    pvUpdate(getNesting(person, 'brother'), 'money', 15);
    pvUpdate(person, 'money', 12);
  })

  return waitFlow(person).then((person) => {
    t.is(false, pvState(person, 'richest'));

    pvUpdate(person, 'money', 20);
    return waitFlow(person);
  }).then(person => {
    t.is(true, pvState(person, 'richest'));

  })

});

test('compx calculated from parent and root states', t => {
  var DeepestChild = spv.inh(Model, {}, {
    '+states': {
      'description_name': [
        'compx',
        ['#family_name', '^name', 'name'],
        function(family_name, parent_name, name) {
          return `${name} ${family_name}, son of ${parent_name}`
        }
      ]
    }
  });
  var DeepChild = spv.inh(Model, {}, {
    'nest-child': [DeepestChild],
  });
  var Child = spv.inh(Model, {}, {
    'nest-child': [DeepChild],
  });
  var app = init({
    'nest-child': [Child]
  }).app_model;


  return waitFlow(app).then((app) => {
    const {
      child,
      deep_child,
      deepest_child,
    } = getModels(app);

    pvUpdate(app, 'family_name', 'Smith');
    pvUpdate(deep_child, 'name', 'John');
    pvUpdate(deepest_child, 'name', 'Mike')

    return waitFlow(app);
  }).then(app => {
    const { deepest_child } = getModels(app);
    t.is('Mike Smith, son of John', pvState(deepest_child, 'description_name'));

  })

  function getModels(app) {
    var child = getNesting(app, 'child');
    var deep_child = getNesting(child, 'child')
    var deepest_child = getNesting(deep_child, 'child')

    return {
      child,
      deep_child,
      deepest_child,
    }
  };

});
