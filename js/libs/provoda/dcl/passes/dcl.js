define(function(require){
'use strict';
var spv = require('spv')
var parseMultiPath = require('../../utils/multiPath/parse')
// var utils = require('../../utils/index.js');
// var getParsedState = utils.getParsedState

// SINGLE

// 'created_song': {
//   to: ['/playlists/:playlist_name/@songs_list', {
//     method: 'at_start' || 'at_end' || 'set_one' || 'replace' || 'at_index' || 'move_to',
//     model: Model,
//   }],
//   fn: [
//     ['dep1', 'dep2', 'dep3', '$'],
//     function(data, dep1, dep2, dep3, get) {
//       return []
//     }
//   ]
// },


// # MULTY

// 'nesting:some_nesting': {
//     to: {
//         '*': true, // works, but depricated
//         'next': [
//           'selected', {
//               // we can declare multiple targets. next and prev are nicknames. only to use it in answer/return
//               base: 'arg_nesting_next',
//               // target prop wil set target to next value of `some_nesting`
//               // `selected` is state name
//               // so `selected` will be changed to new value of `some_nesting`
//
//               // so: selected prop of next nesting:some_nesting can be setted by using `next` in answer
//           }
//         ],
//         'prev': [
//           'selected', {
//               base: 'arg_nesting_prev',
//               // `target` prop wil set target to prev value of `some_nesting`
//               // so `selected` will be changed to old value of `some_nesting`
//           }
//         ]
//     },
//     fn: function(data, $) {
//         return {
//             next: true, // Исполнитель должен проверить hasOwnProperty()
//             prev: false,
//             '*': {589592873598724: {nestings: {}, states: {}}}
//         }
//     }
// },

var targetData = function(to, result_name) {
  var target_path = to[0];
  var options = to[1];
  var parsed_path = parseMultiPath(target_path, true)

  if (parsed_path.result_type == 'nesting' && (!options || !options.schema)) {
    console.warn('implement schema parsing. add schema to pass dcl')
  }

  return {
    path_type: target_path == '*' ? 'by_provoda_id' : 'by_path',
    value_by_name: result_name ? true : false,
    target_path: parsed_path,
    options: options,
    result_name: result_name,
  }
}

var targetsList = function(byName) {
  var result = [];
  for (var name in byName) {
    if (!byName.hasOwnProperty(name)) {
      continue;
    }
    result.push(targetData(byName[name], name))
  }
  return result;
}

var empty = [];

var getDeps = function(deps) {
  if (!deps || !deps.length) {
    return empty
  }

  var result = new Array(deps.length)
  for (var i = 0; i < deps.length; i++) {
    var cur = parseMultiPath(deps[i], true);
    if (cur.result_type != 'nesting' && cur.result_type != 'state') {
      console.warn('please use nesting and state', deps[i])
    }
    result[i] = cur

  }
  return result;
}

var PassDcl = function(name, data) {
  this.name = name;
  this.by_named_result = !Array.isArray(data.to)

  this.targets_list = null;
  this.target_single = null;

  if (this.by_named_result) {
    this.targets_list = targetsList(data.to)
  } else {
    this.target_single = targetData(data.to)
  }

  this.deps = null
  this.fn = null

  if (typeof data.fn === 'function') {
    this.fn = data.fn
  } else {
    this.deps = getDeps(data.fn[0]);
    this.fn = data.fn[1];
  }

}

return PassDcl;
})
