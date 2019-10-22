define(function(require) {
'use strict';
var spv = require('spv')
var cloneObj = spv.cloneObj;
var getCachedPVData = require('./getCachedPVData');
var patchNode = require('./patchNode');
var buildClone = require('./buildClone');
var unsetStrucKey = getCachedPVData.unsetStrucKey;
var setStrucKey = getCachedPVData.setStrucKey;
var directives_parsers = require('./directives_parsers');
var scope_generators_p = directives_parsers.scope_generators_p;


function getCommentPVData(cur_node, struc_store, getSample) {
  return getCachedPVData(cur_node, struc_store, true, getSample);
}

function getPVData(cur_node, struc_store, getSample) {
  return getCachedPVData(cur_node, struc_store, false, getSample);
}

var createPvNest = scope_generators_p['pv-nest'];

var getMarkedPvNest = function (node, pv_nest, struc_store, getSample) {
  if (!pv_nest) {
    return node;
  }

  var directives_data = cloneObj({}, getPVData(node, struc_store, getSample));

  if (directives_data.instructions['pv-nest']) {
    throw new Error('pv-import and sample itself could not be both marked as pv-nest');
  }


  directives_data.instructions = cloneObj({}, directives_data.instructions);
  directives_data.instructions['pv-nest'] = createPvNest(node, pv_nest);
  directives_data.new_scope_generator = true;

  var result = unsetStrucKey(node);
  setStrucKey(node, struc_store, directives_data);

  return result;
};

return function getPatchedTree(original_node, struc_store, getSample, opts, sample_id) {
  var node = getMarkedPvNest(
    buildClone(original_node, struc_store, sample_id),
    opts && opts.pv_nest,
    struc_store,
    getSample
  );

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
