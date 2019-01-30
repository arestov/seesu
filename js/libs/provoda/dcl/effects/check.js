define(function(require) {
'use strict';
var cloneObj = require('spv').cloneObj


// var NestReqMap = null

// var NestSelector = require('../nest_sel/item');
// var NestCntDeclr = require('../nest_conj/item')
// var NestDcl = require('../nest/item');
// var NestCompx = require('../nest_compx/item')
var NestReqMap = require('./legacy/nest_req/dcl')
var StateReqMap = require('./legacy/state_req/dcl')
var StateBindDeclr = require('./legacy/subscribe/dcl')

// var buildSel = require('../nest_sel/build');
var buildNestReqs = require('./legacy/nest_req/rebuild');
var buildStateReqs = require('./legacy/state_req/rebuild')
var buildSubscribes = require('./legacy/subscribe/rebuild')

var parse = function(name, data) {
  var type = data.type;
  switch (type) {
    case 'state_request': {
      return new StateReqMap(name, data);
    }
    case 'nest_request': {
      return new NestReqMap(name, data);
    }
    case 'subscribe': {
      return new StateBindDeclr(name, data);
    }
  }

  throw new Error('unsupported type ' + type);
}

var extend = function(index, more_effects) {
  var cur = cloneObj({}, index) || {};

  for (var name in more_effects) {
    var data = more_effects[name]
    var dcl = parse(name, data);
    cur[name] = {
      dcl: dcl,
      type: data.type,
    }
  }

  return cur;
}

var byType = function(index) {
  var result = {};
  for (var name in index) {
    if (!index.hasOwnProperty(name)) {
      continue
    }

    var cur = index[name]
    var type = cur.type

    result[type] = result[type] || {};
    result[type][name] = cur.dcl;
  }

  return result;
}


var notEqual = function(one, two) {
  if (!one || !two) {
    return one !== two;
  }

  for (var name in one) {
    if (!one.hasOwnProperty(name)) {
      continue;
    }
    if (one[name] !== two[name]) {
      return true;
    }
  }

  for (var name in two) {
    if (!two.hasOwnProperty(name)) {
      continue;
    }

    if (one[name] !== two[name]) {
      return true;
    }
  }
}

var rebuildType = function(self, type, result, list, typed_state_dcls) {
  switch (type) {
    case 'state_request': {
      buildStateReqs(self, list)
      return;
    }
    case 'nest_request': {
      buildNestReqs(self, result, typed_state_dcls);
      return;
    }
    case 'subscribe': {
      buildSubscribes(self, list)
      return;
    }
  }
}

var rebuild = function(self, newV, oldV, listByType, typed_state_dcls) {
  for (var type in newV) {
    if (!newV.hasOwnProperty(type)) {
      continue;
    }

    if (!notEqual(newV[type], oldV[type])) {
      continue;
    }

    rebuildType(self, type, newV[type], listByType[type], typed_state_dcls)
  }
}

var checkModern = function(self, props) {
  if (!props['+effects']) {
    return;
  }

  self._extendable_effect_index = extend(
    self._extendable_effect_index,
    props['+effects'].consume
  );
}

return function checkEffects(self, props, typed_state_dcls) {

  var currentIndex = self._extendable_effect_index;

  checkModern(self, props);

  if (currentIndex === self._extendable_effect_index) {
    return;
  }


  var oldByType = self._effect_by_type || {};
  self._effect_by_type = byType(self._extendable_effect_index);

  self._effect_by_type_listed = {}
  for (var type_name in self._effect_by_type) {
    if (!self._effect_by_type.hasOwnProperty(type_name)) {
      continue;
    }

    var result = []

    var cur = self._effect_by_type[type_name]
    for (var effect_name in cur) {
      if (!cur.hasOwnProperty(effect_name)) {
        continue
      }
      result.push(cur[effect_name])
    }

    self._effect_by_type_listed[type_name] = result

  }

  rebuild(self, self._effect_by_type, oldByType, self._effect_by_type_listed, typed_state_dcls)

  if (self.hasOwnProperty('netsources_of_nestings') || self.hasOwnProperty('netsources_of_states')) {
    self.netsources_of_all = {
      nestings: self.netsources_of_nestings,
      states: self.netsources_of_states
    };
  }
  return true;
}
})
