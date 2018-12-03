// - написать функцию которая получает модели из multiPath
// - написать функцию которая аггрегирует значения из моделей multiPath
// - написать функцию, котоая записывает state/nesting в модели multiPath

define(function(require) {
'use strict';
var getNesting = require('pv/getNesting')
var getStart = require('./getStart')

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
  var start_md = getStart(md, multi_path)

  return getDeepNesting(
    start_md,
    multi_path
  )
  // var base;
  // var resource;
  // var nesting;

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
  for (var i = 0; i < exec_path.length; i++) {
    var nested = []
    var nest_name = exec_path[i]
    add(nested, cur, nest_name)
    cur = nested
  }

  return cur;
}

return getModels;
})
