define(function(require) {
'use strict';
var getCachedPVData = require('./getCachedPVData');
var patchNode = require('./patchNode');
var buildClone = require('./buildClone');

function getCommentPVData(cur_node, struc_store, getSample) {
	return getCachedPVData(cur_node, struc_store, true, getSample);
}

function getPVData(cur_node, struc_store, getSample) {
	return getCachedPVData(cur_node, struc_store, false, getSample);
}

return function getPatchedTree(original_node, struc_store, getSample, opts, sample_id) {
  var node = buildClone(original_node, struc_store, sample_id);
  // var result = [];

  var match_stack = [ node ], i = 0;
  while (match_stack.length){
    var cur_node = match_stack.shift();
    var is_start_node = node === cur_node;
    var node_type = cur_node.nodeType;
    var directives_data = null;
    if (node_type == 1){
      directives_data = getPVData(cur_node, struc_store, getSample);
      // result.push(cur_node, directives_data);
    } else if (node_type == 8) {
      directives_data = getCommentPVData(cur_node, struc_store, getSample);
      // result.push(cur_node, directives_data);
    }

    var patched = !is_start_node && patchNode(cur_node, struc_store, directives_data, getSample, opts);
    if (patched) {
      match_stack.unshift(patched);
    }


    // if (directives_data.replacer) {
    // 	match_stack.unshift(directives_data.node);
    // }

    if (node_type == 1){
      for (i = 0; i < cur_node.childNodes.length; i++) {
        match_stack.push(cur_node.childNodes[i]);
      }
    }

  }
  // return result;
  return node;
};

});
