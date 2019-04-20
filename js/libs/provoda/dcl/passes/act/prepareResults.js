define(function(require) {
'use strict';
var getTargetModels = require('./getTargetModels')
var prepareNestingValue = require('./prepareNestingValue')
var countKeys = require('spv').countKeys
var getModelById = require('../../../utils/getModelById');
var initPassedValue = prepareNestingValue.initPassedValue

var prepareAndHold = function(md, target, value, mut_refs_index, mut_wanted_ref) {
  var multi_path = target.target_path

  switch (multi_path.result_type) {
    case "nesting": {
      return {
        target: target,
        target_md: md,
        value: initPassedValue(md, target, value, mut_refs_index, mut_wanted_ref)
      }
      return
    }
    case "state": {
      return {target: target, target_md: md, value: value}
    }
  }
}

var unwrap = function (md, target, value, data, mut_refs_index, mut_wanted_ref, mut_result) {
  if (target.path_type == 'by_provoda_id') {
    mut_result.push({target: target, md: md, value: value, data: data})
    return
  }

  var models = getTargetModels(md, target, data)

  if (Array.isArray(models)) {
    for (var i = 0; i < models.length; i++) {
      var cur = models[i];
      mut_result.push(
        prepareAndHold(cur, target, value, mut_refs_index, mut_wanted_ref, mut_result)
      )
    }
  } else {
    mut_result.push(
      prepareAndHold(models, target, value, mut_refs_index, mut_wanted_ref, mut_result)
    )
  }

}

var needsReplace = function(item) {
  return Boolean(item.use_ref_id)
}

var replaceItem = function(md, item, mut_refs_index) {
  if (!item || !needsReplace(item)) {
    return item
  }

  if (!mut_refs_index.hasOwnProperty(item.use_ref_id)) {
    throw new Error('cant use ref_id: ' + item.use_ref_id)
  }

  return getModelById(md, mut_refs_index[item.use_ref_id])
}


var completeValues = function(list, mut_refs_index, mut_wanted_ref) {
  var lst_wanted = mut_wanted_ref

  while (true) {
    var local_wanted = {}

    for (var i = 0; i < list.length; i++) {
      var cur = list[i]
      var target = cur.target
      var multi_path = target.target_path
      if (multi_path.result_type !== 'nesting') {
        continue
      }


      cur.value = prepareNestingValue(
        cur.target_md, target, cur.value, mut_refs_index, local_wanted
      )

      list[i] = cur
    }

    if (!countKeys(lst_wanted)) {
      break
    }

    if (countKeys(local_wanted) >= countKeys(lst_wanted)) {
      throw new Error('cant hold refs: ' + Object.keys(local_wanted))
    }

    lst_wanted = local_wanted
  }

}


return function(md, dcl, value, data) {

  var mut_result = []
  var mut_refs_index = {}
  var mut_wanted_ref = {}

  if (!dcl.targets_list) {
    unwrap(md, dcl.target_single, value, data, mut_refs_index, mut_wanted_ref, mut_result)
    completeValues(mut_result, mut_refs_index, mut_wanted_ref)
    return mut_result
  }

  if (value !== Object(value)) {
    throw new Error('return object from handler')
  }

  for (var i = 0; i < dcl.targets_list.length; i++) {
    var cur = dcl.targets_list[i]
    if (!value.hasOwnProperty(cur.result_name)) {
      continue;
    }
    unwrap(md, cur, value[cur.result_name], data, mut_refs_index, mut_wanted_ref, mut_result)
  }

  completeValues(mut_result, mut_refs_index, mut_wanted_ref)

  return mut_result

}
})
