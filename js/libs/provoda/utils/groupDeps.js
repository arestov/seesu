define(function(require) {
'use strict';
function groupDeps(parse, getDeps) {
  return function(list) {
    var states_of_parent = {};
    var states_of_nesting = {};
    var states_of_root = {};

    for (var i = 0; i < list.length; i++) {
      var cur = list[i];
      var deps_list = getDeps(cur)

      for (var jj = 0; jj < deps_list.length; jj++) {
        var state_name = deps_list[jj];
        var parsing_result = parse(state_name);
        if (!parsing_result) {
          continue;
        }
        switch (parsing_result.rel_type) {
          case 'root': {
            if (!states_of_root[state_name]) {
              states_of_root[state_name] = parsing_result;
            }
          }
          break;
          case 'nesting': {
            if (!states_of_nesting[state_name]) {
              states_of_nesting[state_name] = parsing_result;
            }
          }
          break;
          case 'parent': {
            if (!states_of_parent[state_name]) {
              states_of_parent[state_name] = parsing_result;
            }
          }
          break;
        }
      }
    }

    return {
      conndst_parent: toList(states_of_parent),
      conndst_nesting: toList(states_of_nesting),
      conndst_root: toList(states_of_root),
    }
  }
}


function toList(obj) {
  var result = [];
  for (var p in obj){
    if (obj.hasOwnProperty(p)){
      result.push(obj[p]);
    }
  }
  return result;
}

return groupDeps

})
