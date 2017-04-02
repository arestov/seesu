define(function(require){
'use strict';
var spv = require('spv');
var handleAdding = require('./handleNestPAdding');

return function markNestingParticipation(md, nesting_name, added, removed) {
  if (removed) {
    if (Array.isArray(removed)) {
      for (var i = 0; i < removed.length; i++) {
        handleRemoving(md, nesting_name, removed[i], i);
      }
    } else {
      handleRemoving(md, nesting_name, removed, 0);
    }
  }

  if (added) {
    if (Array.isArray(added)) {
      for (var i = 0; i < added.length; i++) {
        handleAdding(md, nesting_name, added[i], i);
      }
    } else {
      handleAdding(md, nesting_name, added, 0);
    }
  }
};


function handleRemoving(md, nesting_name, item, pos) {
  unmark(md, nesting_name, item, pos);
}

function unmark(md, nesting_name, cur) {
  if (!cur._provoda_id) {
    return;
  }

  var key = nesting_name + ' - ' + cur._provoda_id;
  return spv.set.remove(cur._participation_in_nesting, key);
}




});
