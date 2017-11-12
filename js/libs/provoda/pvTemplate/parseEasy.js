define(function(require) {
'use strict';
var getCachedPVData = require('./getCachedPVData');
var patchNode = require('./patchNode');

function getCommentPVData(cur_node, struc_store, getSample) {
  return getCachedPVData(cur_node, struc_store, true, getSample);
}

function getPVData(cur_node, struc_store, getSample) {
  return getCachedPVData(cur_node, struc_store, false, getSample);
}


return function parserEasy(start_node, vroot_node, struc_store, getSample) {
  //полный парсинг, байндинг одного scope (раньше и парсинг был только в пределах одного scope)
  var list_for_binding = [];
  var match_stack = [ start_node, true ];

  while (match_stack.length){
    var cur_node = match_stack.shift();
    var can_bind = match_stack.shift();
    var node_type = cur_node.nodeType;
    var directives_data = null;
    var is_start_node = cur_node === start_node;

    if (node_type == 1){
      var i = 0;
      var is_root_node = vroot_node === cur_node;
      directives_data = getPVData(cur_node, struc_store, getSample);

      var can_bind_children = (!directives_data.new_scope_generator || is_root_node);

      // if (directives_data.replacer) {
      // 	match_stack.unshift(directives_data.node);
      // } else {
        for (i = 0; i < cur_node.childNodes.length; i++) {
          // если запрещен байндинг текущего нода, то и его потомков тоже запрещён
          match_stack.push(cur_node.childNodes[i], can_bind && can_bind_children);
        }
        if (can_bind) {
          list_for_binding.push(is_root_node, cur_node, directives_data);
        }
      // }
    } else if (node_type == 8) {
      directives_data = getCommentPVData(cur_node, struc_store, getSample);
      // if (directives_data.replacer) {
        // match_stack.unshift(directives_data.node, can_bind);
      // } else
      if (can_bind) {
        list_for_binding.push(false, cur_node, directives_data);
      }
    }
    var patched = !is_start_node && patchNode(cur_node, struc_store, directives_data, getSample, null);
    if (patched) {
      match_stack.unshift(patched, can_bind);
    }
  }
  return list_for_binding;
};
});
