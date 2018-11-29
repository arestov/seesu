// - написать функцию которая получает модели из multiPath
// - написать функцию которая аггрегирует значения из моделей multiPath
// - написать функцию, котоая записывает state/nesting в модели multiPath

define(function(require) {
'use strict';
var getNesting = require('pv/getNesting')
var initDeclaredNestings = require('../../initDeclaredNestings');
var getSPByPathTemplateAndData = initDeclaredNestings.getSPByPathTemplateAndData;
var empty = {}
// {
//   result_type: result_type,
//   state: {
//     base: string.split('.')[0],
//     path: string,
//   },
//   nesting: {
//     path: path,
//     zip_name: parts[0] || null,
//   },
//   resource: {
//     path: string,
//   },
//   from_base: {
//     type: 'parent',
//     steps: from_parent_num[0].length,
//   },
// }

var getModels = function(md, multi_path) {
  return getDeepNesting(
    getResourse(
      getBase(md, multi_path),
      multi_path
    ),
    multi_path,
  )
  // var base;
  // var resource;
  // var nesting;

}

function getBase(md, multi_path) {
  /*
  {
    type: 'parent',
    steps: from_parent_num[0].length,
  },
  */
  var info = multi_path.base

  if (multi_path || !multi_path.type) {
    return md;
  }

  if (info.type === 'root') {
    return md.getStrucRoot();
  }

  return md.getStrucParent(info.steps)
}

function getResourse(md, multi_path) {
  /*
   {
    path: string,
  },
  */

  var info = multi_path.resource

  if (!info || !info.path) {
    return md;
  }

  return getSPByPathTemplateAndData(md.app, md, info.path, false, empty)
}

function add(result, list, nest_name) {
  if (!list) {
    return
  }

  if (!Array.isArray(list)) {
    result.push(getNesting(list, nest_name))
  }

  for (var i = 0; i < list.length; i++) {
    result.push(getNesting(list[i], nest_name))
  }
}

function getDeepNesting(md, multi_path) {
  /*
  {
    path: path,
    zip_name: parts[0] || null,
  }
  */
  var info = multi_path.nesting
  var just_base = multi_path.result_type === 'nesting'

  if (!info || !info.path) {
    return md;
  }

  var exec_path = just_base ? info.base : info.path

  var cur = [md]
  for (var i = 0; i < info.path.length; i++) {
    var nested = []
    var nest_name = info.path[i]
    add(nested, cur, nest_name)
    cur = nested
  }

  return cur;
}

return getModels;
})
