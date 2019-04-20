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

var cloneObj = spv.cloneObj
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
  // todo: value could array
  // isProvodaBhv(value or value[n]) could be true

  // expected `value` is : {states: {}, nestings: {}}
  var init_data = {}

  cloneObj(init_data, value)
  init_data.init_version = 2
  init_data.by = 'prepareNestingValue'
  return md.initSi(Constr, init_data);
}

var initItemsList = function(md, target, value) {
  if (!value) {
    return value
  }

  var list = toArray(value)
  if (isOk(list)) {
    return list
  }

  var result = new Array(list.length)
  for (var i = 0; i < list.length; i++) {
    var cur = list[i]
    result[i] = initItem(cur, target, value)
  }
  return result
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
      return toStart(current_value, initItemsList(md, target, value))
    }
    case "at_end": {
      return toEnd(current_value, initItemsList(md, target, value))
    }
    case "at_index": {
      return toIndex(current_value, initItemsList(md, target, value[1]), value[0])
    }
    case "replace": {
      return replaceAt(current_value, initItemsList(md, target, value[1]), value[0])
    }
    case "set_one": {
      if (value && Array.isArray(value)) {
        throw new Error('value should not be list')
      }
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

  if (!Array.isArray(list)) {
    return isProvodaBhv(list)
  }


  if (!list.length) {
    return true
  }

  return list.every(isProvodaBhv)

}
})
