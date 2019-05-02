define(function(require) {
'use strict';
var spv = require('spv')
var getNesting = require('pv/getNesting')

var get_constr = require('../../../structure/get_constr');
var getModelById = require('../../../utils/getModelById');

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
  if (typeof index != 'number') {
    throw 'index should be numer'
  }
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
  if (typeof index != 'number') {
    throw 'index should be numer'
  }

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

var needsRefs = function(init_data) {

  for (var nesting_name in init_data.nestings) {
    if (!init_data.nestings.hasOwnProperty(nesting_name)) {
      continue
    }
    var cur = init_data.nestings[nesting_name]
    if (!Array.isArray(cur)) {
      if (needsRefs(cur)) {
        return true
      }
      continue
    }

    if (cur.some(needsRefs)) {
      return true
    }

  }

  if (init_data.use_ref_id) {
    return true
  }

}

var replaceRefs = function(md, init_data, mut_wanted_ref, mut_refs_index) {
  if (init_data.use_ref_id) {
    if (mut_refs_index[init_data.use_ref_id]) {
      return getModelById(md, mut_refs_index[init_data.use_ref_id])
    }



    mut_wanted_ref[init_data.use_ref_id] = init_data.use_ref_id

    return init_data
  }


  var result = cloneObj({}, init_data)
  if (init_data.nestings) {
    result.nestings = cloneObj({}, init_data.nestings)
  }

  for (var nesting_name in init_data.nestings) {
    if (!init_data.nestings.hasOwnProperty(nesting_name)) {
      continue
    }
    var cur = init_data.nestings[nesting_name]
    if (!Array.isArray(cur)) {
      result.nestings[nesting_name] = replaceRefs(md, cur, mut_wanted_ref, mut_refs_index)
      continue
    }

    var list = []
    for (var i = 0; i < cur.length; i++) {
      list.push(replaceRefs(md, cur[i], mut_wanted_ref, mut_refs_index))
    }
  }

  return result
}

var initItem = function(md, target, raw_value, mut_refs_index, mut_wanted_ref) {
  if (isOk(raw_value)) {
    return raw_value;
  }

  if (target.options.model) {
    throw new Error('implement me')
  }

  var value;
  if (!needsRefs(raw_value)) {
    value = raw_value
  } else {
    var local_wanted = {}
    value = replaceRefs(md, raw_value, local_wanted, mut_refs_index)

    if (isOk(value)) {
      return value;
    }

    if (spv.countKeys(local_wanted)) {
      cloneObj(mut_wanted_ref, local_wanted)
      return value
    }
  }

  var multi_path= target.target_path
  var nesting_name = multi_path.nesting.target_nest_name

  var Constr = getNestingConstr(md.app, md, nesting_name)
  if (!Constr) {
    throw new Error('cant find Constr for ' + nesting_name)
    // todo - move validation to dcl process
  }



  // expected `value` is : {states: {}, nestings: {}}
  var init_data = {}

  cloneObj(init_data, value)
  init_data.init_version = 2
  init_data.by = 'prepareNestingValue'
  var created_model = md.initSi(Constr, init_data)

  if (value.hold_ref_id) {
    if (mut_refs_index[value.hold_ref_id]) {
      throw new Error('ref id holded already ' + value.hold_ref_id)
    }
    mut_refs_index[value.hold_ref_id] = created_model._provoda_id
  }

  return created_model
}

var initItemsList = function(md, target, value, mut_refs_index, mut_wanted_ref) {
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
    result[i] = initItem(md, target, cur, mut_refs_index, mut_wanted_ref)
  }
  return result
}

var initValue = function(md, target, value, mut_refs_index, mut_wanted_ref) {
  if (Array.isArray(value)) {
    return initItemsList(md, target, value, mut_refs_index, mut_wanted_ref)
  }

  return initItem(md, target, value, mut_refs_index, mut_wanted_ref)
}

var initPassedValue = function(md, target, value, mut_refs_index, mut_wanted_ref) {
  switch (target.options.method) {
    case "at_index":
    case "replace": {
      return [
        value[0],
        initValue(md, target, value[1], mut_refs_index, mut_wanted_ref),
      ]
    }
  }

  return initValue(md, target, value, mut_refs_index, mut_wanted_ref)
}

var prepareNestingValue = function(md, target, value, mut_refs_index, mut_wanted_ref) {
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
      return toStart(current_value, initItemsList(md, target, value, mut_refs_index, mut_wanted_ref))
    }
    case "at_end": {
      return toEnd(current_value, initItemsList(md, target, value, mut_refs_index, mut_wanted_ref))
    }
    case "at_index": {
      return toIndex(
        current_value,
        initItemsList(md, target, value[1], mut_refs_index, mut_wanted_ref),
        value[0]
      )
    }
    case "replace": {
      return replaceAt(
        current_value,
        initItemsList(md, target, value[1], mut_refs_index, mut_wanted_ref),
        value[0]
      )
    }
    case "set_one": {
      if (value && Array.isArray(value)) {
        throw new Error('value should not be list')
      }
      return initItem(md, target, value, mut_refs_index, mut_wanted_ref)
    }
    case "set_many": {
      if (value && !Array.isArray(value)) {
        throw new Error('value should be list')
      }
      return initItemsList(md, target, value, mut_refs_index, mut_wanted_ref)
    }
    //|| 'set_one'
    //|| 'replace'
    //|| 'move_to',

  }


  // d
}

prepareNestingValue.initValue = initValue
prepareNestingValue.initPassedValue = initPassedValue

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
