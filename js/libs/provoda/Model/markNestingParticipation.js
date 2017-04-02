define(function(require){
'use strict';
var handleAdding = require('./handleNestPAdding');
var handleRemoving = require('./handleNestPRemoving');

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

});
