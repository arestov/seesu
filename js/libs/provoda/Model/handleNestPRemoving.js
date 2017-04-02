define(function (require) {
'use strict';
var spv = require('spv');

return function handleRemoving(md, nesting_name, item, pos) {
  unmark(md, nesting_name, item, pos);
}

function unmark(md, nesting_name, cur) {
  if (!cur._provoda_id) {
    return;
  }

  var key = nesting_name + ' - ' + cur._provoda_id;
  return spv.set.remove(cur._participation_in_nesting, key);
}
})
