define(function(require) {
'use strict';
var getTargetModels = require('./getTargetModels')
var prepareNestingValue = require('./prepareNestingValue')
var cloneObj = require('spv').cloneObj
var getModelById = require('../../../utils/getModelById');


var prepareAndHold = function(md, target, value, mut_refs_index, mut_result) {
  var multi_path = target.target_path

  switch (multi_path.result_type) {
    case "nesting": {
      var item = {
        target: target,
        target_md: md,
        value: prepareNestingValue(md, target, value, mut_refs_index)
      }
      mut_result.push(item)
      return
    }
    case "state": {
      mut_result.push({target: target, target_md: md, value: value})
      return
    }
  }
}

var createAndHold = function (md, target, value, data, mut_refs_index, mut_result) {
  if (target.path_type == 'by_provoda_id') {
    mut_result.push({target: target, md: md, value: value, data: data})
    return
  }

  var models = getTargetModels(md, target, data)

  if (Array.isArray(models)) {
    for (var i = 0; i < models.length; i++) {
      var cur = models[i];
      prepareAndHold(cur, target, value, mut_refs_index, mut_result)
    }
  } else {
    prepareAndHold(models, target, value, mut_refs_index, mut_result)
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

var replaceNestingItem = function (md, list, mut_refs_index) {
  if (!Array.isArray(list)) {
    return replaceItem(md, list, mut_refs_index)
  }

  if (!list.some(needsReplace)) {
    return list
  }

  var result = []
  for (var i = 0; i < list.length; i++) {
    result.push(replaceItem(md, list[i], mut_refs_index))
  }

}

var linkToHolded = function (mut_refs_index, mut_result) {
  for (var i = 0; i < mut_result.length; i++) {
    var cur = mut_result[i]
    var target = cur.target
    var multi_path = target.target_path

    if (multi_path.result_type !== 'nesting') {
      continue;
    }

    var newItem = cloneObj({}, cur)
    newItem.value = replaceNestingItem(newItem.md, newItem.value, mut_refs_index)
    mut_result[i] = newItem
  }
}


return function(md, dcl, value, data) {

  var mut_result = [];
  var mut_refs_index = {}

  if (!dcl.targets_list) {
    createAndHold(md, dcl.target_single, value, data, mut_refs_index, mut_result)
    linkToHolded(mut_refs_index, mut_result)
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
    createAndHold(md, cur, value[cur.result_name], data, mut_refs_index, mut_result)
  }

  linkToHolded(mut_refs_index, mut_result)

  return mut_result

}
})
