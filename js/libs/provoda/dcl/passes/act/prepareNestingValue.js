define(function(require) {
'use strict';
var spv = require('spv')
var pvUpdate = require('pv/update')
var pvState = require('pv/state')
var getNesting = require('pv/getNesting')

var updateNesting = require('pv/updateNesting')
var readDepValue = require('../../../utils/readDepValue').depValue
var getModels = require('../../../utils/multiPath/getModels')
var getValues = require('../../../utils/multiPath/getValues')
var getModelById = require('../../../utils/getModelById');
var get_constr = require('../../../structure/get_constr');

var getNestingConstr = get_constr.getNestingConstr;

var push = Array.prototype.push
var unshift = Array.prototype.unshift
var splice = Array.prototype.splice

var toArray = function(value) {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? value : [value]
}

var toStart = function(old_value, value) {
  var old_list = toArray(old_value)
  var to_add = toArray(value)
  var result = old_list ? old_list.slice(0) : []
  if (to_add) {
    unshift.apply(result, to_add)
  }
  return result
}

var toEnd = function(old_value, value) {
  var old_list = toArray(old_value)
  var to_add = toArray(value)
  var result = old_list ? old_list.slice(0) : []

  if (to_add) {
    push.apply(result, to_add)
  }
  return result
}

var toIndex = function(old_value, value, index) {
  var old_list = toArray(old_value)
  var to_add = toArray(value)
  var result = old_list ? old_list.slice(0) : []

  if (to_add) {
    for (var i = 0; i < to_add.length; i++) {
      splice.call(result, index + i, 0, to_add[i])
    }
  }

  return result
}

var replaceAt = function(old_value, value, index) {
  var old_list = toArray(old_value)
  var to_add = toArray(value)
  var result = old_list ? old_list.slice(0) : []

  if (to_add) {
    for (var i = 0; i < to_add.length; i++) {
      splice.call(result, index + i, 1, to_add[i])
    }
  }

  return result
}

var initItem = function(md, target, value) {
  if (isOk(value)) {
    return value;
  }

  if (target.options.model) {
    throw new Error('implement me')
  }
  var multi_path= target.target_path
  var nesting_name = multi_path.nesting.target_nest_name

  var Constr = getNestingConstr(md.app, md, nesting_name)

  // expected `value` is : {states: {}, nestings: {}}
  return md.initSi(Constr, value);
}

var prepareNestingValue = function(md, target, value) {
  var multi_path = target.target_path

  if (!target.options.method) {
    if (!isOk(value)) {
      throw new Error('unexpected nesting')
    }

    return value
  }

  var nesting_name = multi_path.nesting.target_nest_name
  var current_value = getNesting(md, nesting_name)


  switch (target.options.method) {
    case "at_start": {
      return toStart(current_value, initItem(md, target, value))
    }
    case "at_end": {
      return toEnd(current_value, initItem(md, target, value))
    }
    case "at_index": {
      return toIndex(current_value, initItem(md, target, value[1]), value[0])
    }
    case "replace": {
      return replaceAt(current_value, initItem(md, target, value[1]), value[0])
    }
    case "set_one": {
      return initItem(md, target, value)
    }
    //|| 'set_one'
    //|| 'replace'
    //|| 'move_to',

  }


  // d
}
return prepareNestingValue;

function isProvodaBhv(md) {
  return md.hasOwnProperty('_provoda_id') || md.hasOwnProperty('view_id')
}

function isOk(list) {
  if (!list) {
    return true;
  }

  if (Array.isArray(list)) {
    if (!list.length) {
      return true
    }

    return list.every(isProvodaBhv)
  }

  return isProvodaBhv(list)
}
})
